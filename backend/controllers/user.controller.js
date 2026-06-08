import User from '../models/User.js';
import Broadcast from '../models/Broadcast.js';
import cloudinary from '../utils/cloudinary.js';
import { validateAndSanitizeRelationship } from './friends.controller.js';
import UsernameOwnership from '../models/UsernameOwnership.js';
import UsernameChangeRequest from '../models/UsernameChangeRequest.js';

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const query = { 
      _id: { $ne: loggedInUserId },
      status: { $ne: 'banned' } 
    };

    if (req.user.role !== 'admin') {
      query.role = { $ne: 'admin' };
    }

    // Don't fetch the current user, banned users, or admins (unless logged-in user is admin)
    const filteredUsers = await User.find(query).select("-password");
    
    const loggedInUser = await User.findById(loggedInUserId);
    const myOnlineStatusEnabled = loggedInUser?.privacySettings?.onlineStatus !== false;

    const sanitizedUsers = filteredUsers.map(u => {
      const userObj = u.toObject();
      const userOnlineStatusEnabled = u.privacySettings?.onlineStatus !== false;

      if (!myOnlineStatusEnabled || !userOnlineStatusEnabled) {
        userObj.isOnline = false;
        delete userObj.lastSeen;
      }
      return userObj;
    });

    res.status(200).json(sanitizedUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { displayName, bio, profilePic, socialLinks } = req.body;
    const userId = req.user._id;

    let updatedFields = {};
    if (displayName) updatedFields.displayName = displayName;
    if (bio !== undefined) updatedFields.bio = bio;
    if (socialLinks) updatedFields.socialLinks = socialLinks;

    if (profilePic) {
      const uploadResponse = await cloudinary.uploader.upload(profilePic, {
        folder: "orbit/profiles",
        transformation: [
          { width: 500, height: 500, crop: "fill", gravity: "face" },
          { quality: "auto:best", fetch_format: "auto" }
        ]
      });
      updatedFields.profilePic = uploadResponse.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      updatedFields, 
      { new: true }
    ).select("-password");

    if (req.io) {
      req.io.emit('userProfileUpdated', {
        userId: updatedUser._id,
        updatedData: {
          displayName: updatedUser.displayName,
          bio: updatedUser.bio,
          socialLinks: updatedUser.socialLinks,
          profilePic: updatedUser.profilePic
        }
      });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error in updateProfile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const changeUsername = async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.user._id;

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const cleanUsername = username.toLowerCase().trim();

    const usernameRegex = /^[a-z0-9_.]+$/;
    if (cleanUsername.length < 4 || cleanUsername.length > 20 || !usernameRegex.test(cleanUsername)) {
      return res.status(400).json({ 
        message: "Username must be 4-20 characters and contain only lowercase letters, numbers, underscores, or dots." 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const maxChanges = user.maxUsernameChanges || 3;
    if (user.usernameChanges >= maxChanges) {
      return res.status(400).json({ message: `Username can no longer be changed (limit of ${maxChanges} reached)` });
    }

    if (cleanUsername === user.username) {
      return res.status(200).json(user);
    }

    const existing = await User.findOne({ username: cleanUsername });
    const existingOwnership = await UsernameOwnership.findOne({ username: cleanUsername });
    
    if (existing) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // Check ownership
    if (existingOwnership && existingOwnership.userId.toString() !== userId.toString()) {
      return res.status(400).json({ message: "This username is reserved by another account and cannot be claimed." });
    }

    user.previousUsernames.push(user.username);
    const oldUsername = user.username;
    user.username = cleanUsername;
    user.usernameChanges += 1;
    await user.save();

    // Ensure the OLD username is locked to this user (if not already)
    const oldOwnership = await UsernameOwnership.findOne({ username: oldUsername });
    if (!oldOwnership) {
      await UsernameOwnership.create({
        userId: user._id,
        username: oldUsername
      });
    }

    // Lock the NEW username to this user
    if (!existingOwnership) {
      await UsernameOwnership.create({
        userId: user._id,
        username: cleanUsername
      });
    }

    const updatedUser = await User.findById(userId).select("-password");
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error in changeUsername:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (req.user.role !== 'admin' && user.role === 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    const loggedInUser = await User.findById(req.user._id);
    const myOnlineStatusEnabled = loggedInUser?.privacySettings?.onlineStatus !== false;
    const userObj = user.toObject();
    const userOnlineStatusEnabled = user.privacySettings?.onlineStatus !== false;

    if (!myOnlineStatusEnabled || !userOnlineStatusEnabled) {
      userObj.isOnline = false;
      delete userObj.lastSeen;
    }

    const idA = req.user._id.toString();
    const idB = user._id.toString();

    const isBlockedByMe = loggedInUser.blockedUsers.map(id => id.toString()).includes(idB);
    const isBlockedByOther = user.blockedUsers.map(id => id.toString()).includes(idA);

    const isFriendMe = loggedInUser.friends.map(id => id.toString()).includes(idB);
    const isFriendOther = user.friends.map(id => id.toString()).includes(idA);

    let relationship = 'NONE';
    if (isBlockedByMe) {
      relationship = 'YOU_BLOCKED';
    } else if (isBlockedByOther) {
      relationship = 'BLOCKED_YOU';
    } else if (isFriendMe && isFriendOther) {
      relationship = 'FRIEND';
    } else {
      // If there is an inconsistent one-sided friendship, heal it asynchronously
      if (isFriendMe || isFriendOther) {
        validateAndSanitizeRelationship(idA, idB, req.io).catch(console.error);
      }

      if (loggedInUser.friendRequests.map(id => id.toString()).includes(idB)) {
        relationship = 'PENDING_INCOMING';
      } else if (loggedInUser.sentRequests.map(id => id.toString()).includes(idB)) {
        relationship = 'PENDING_OUTGOING';
      }
    }

    userObj.relationship = relationship;

    if (relationship !== 'FRIEND') {
      userObj.isOnline = false;
      delete userObj.lastSeen;
    }

    res.status(200).json(userObj);
  } catch (error) {
    console.error("Error in getUserById:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getActiveBroadcasts = async (req, res) => {
  try {
    const userRole = req.user.role;
    
    // Build query
    const query = {
      $or: [
        { audience: 'All Users' },
        { audience: 'Active Users (Last 24h)' },
        { targetUser: req.user._id }
      ]
    };

    if (userRole === 'admin' || userRole === 'moderator') {
      query.$or.push({ audience: 'Moderators Only' });
      query.$or.push({ audience: 'Moderators' });
    }

    // Exclude expired broadcasts
    query.$and = [
      {
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } }
        ]
      }
    ];

    const broadcasts = await Broadcast.find(query)
      .populate('sender', 'displayName username profilePic')
      .sort({ createdAt: -1 });

    res.status(200).json(broadcasts);
  } catch (error) {
    console.error("Error in getActiveBroadcasts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updatePrivacySettings = async (req, res) => {
  try {
    const { readReceipts, onlineStatus } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId).populate('friends', '_id');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (typeof readReceipts === 'boolean') {
      user.privacySettings.readReceipts = readReceipts;
    }
    
    let onlineStatusChanged = false;
    if (typeof onlineStatus === 'boolean' && user.privacySettings?.onlineStatus !== onlineStatus) {
      user.privacySettings.onlineStatus = onlineStatus;
      onlineStatusChanged = true;
    }

    await user.save();

    if (onlineStatusChanged && req.io && user.friends) {
      user.friends.forEach((friend) => {
        req.io.to(friend._id.toString()).emit('friendStatusUpdate', {
          userId: user._id.toString(),
          isOnline: onlineStatus ? user.isOnline : false,
          lastSeen: user.lastActive || new Date()
        });
      });
    }

    res.status(200).json({ message: "Privacy settings updated successfully", privacySettings: user.privacySettings });
  } catch (error) {
    console.error("Error in updatePrivacySettings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const requestUsernameChange = async (req, res) => {
  try {
    const { requestedUsername, reason } = req.body;
    const userId = req.user._id;

    if (!requestedUsername || !reason) {
      return res.status(400).json({ message: "Requested username and reason are required" });
    }

    if (reason.length < 10) {
      return res.status(400).json({ message: "Reason must be at least 10 characters long" });
    }

    const cleanUsername = requestedUsername.toLowerCase().trim();
    const usernameRegex = /^[a-z0-9_.]+$/;
    if (cleanUsername.length < 4 || cleanUsername.length > 20 || !usernameRegex.test(cleanUsername)) {
      return res.status(400).json({ 
        message: "Username must be 4-20 characters and contain only lowercase letters, numbers, underscores, or dots." 
      });
    }

    // Check if user already has a pending request
    const existingPending = await UsernameChangeRequest.findOne({ userId, status: 'pending' });
    if (existingPending) {
      return res.status(400).json({ message: "You already have a pending username change request." });
    }

    // Check availability just in case
    const existing = await User.findOne({ username: cleanUsername });
    const existingOwnership = await UsernameOwnership.findOne({ username: cleanUsername });
    
    if (existing) {
      return res.status(400).json({ message: "Username already taken" });
    }
    if (existingOwnership && existingOwnership.userId.toString() !== userId.toString()) {
      return res.status(400).json({ message: "This username is reserved by another account." });
    }

    const newRequest = await UsernameChangeRequest.create({
      userId,
      requestedUsername: cleanUsername,
      reason
    });

    res.status(201).json(newRequest);
  } catch (error) {
    console.error("Error in requestUsernameChange:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUsernameChangeRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const requests = await UsernameChangeRequest.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    console.error("Error in getUsernameChangeRequests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
