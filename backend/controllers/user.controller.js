import User from '../models/User.js';
import Broadcast from '../models/Broadcast.js';
import cloudinary from '../utils/cloudinary.js';
import { validateAndSanitizeRelationship } from './friends.controller.js';
import UsernameOwnership from '../models/UsernameOwnership.js';
import UsernameChangeRequest from '../models/UsernameChangeRequest.js';
import Connection from '../models/Connection.js';

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
    const myOnlineStatusLevel = loggedInUser?.privacySettings?.onlineStatus || 'nobody';

    const sanitizedUsers = filteredUsers.map(u => {
      const userObj = u.toObject();
      const userOnlineStatusLevel = u.privacySettings?.onlineStatus || 'nobody';

      // Determine relationship
      const idA = loggedInUserId.toString();
      const idB = u._id.toString();
      const isFriend = loggedInUser.friends.map(id => id.toString()).includes(idB) && 
                       u.friends.map(id => id.toString()).includes(idA);

      // Check if user allows me to see their status
      let canSeeThem = true;
      if (userOnlineStatusLevel === 'nobody') canSeeThem = false;
      if (userOnlineStatusLevel === 'specific_friends') {
        const allowedList = u.privacySettings?.onlineStatusAllowed || [];
        if (!allowedList.map(id => id.toString()).includes(idA)) {
          canSeeThem = false;
        }
      }

      // Check if I allow myself to broadcast my status (if I hide my status from everyone, maybe I can still see others? Actually, usually if you hide your status, you can't see others, but user prompt says:
      // "Nobody: Hide online state from everyone. Hide last seen from everyone."
      // The prompt didn't explicitly mention bidirectional restriction like WhatsApp. I'll just apply the rule based on their setting.

      if (!canSeeThem) {
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

    if (profilePic !== undefined) {
      if (profilePic === null || profilePic === '') {
        updatedFields.profilePic = null;
      } else if (profilePic.startsWith('data:image')) {
        const uploadResponse = await cloudinary.uploader.upload(profilePic, {
          folder: "orbit/profiles",
          transformation: [
            { width: 500, height: 500, crop: "fill", gravity: "face" },
            { quality: "auto:best", fetch_format: "auto" }
          ]
        });
        updatedFields.profilePic = uploadResponse.secure_url;
      } else {
        updatedFields.profilePic = profilePic;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      updatedFields, 
      { new: true }
    ).select("-password");

    if (req.io) {
      req.io.except(userId.toString()).emit('userProfileUpdated', {
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

    if (!user.previousUsernames) {
      user.previousUsernames = [];
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
    const userObj = user.toObject();
    
    const idA = req.user._id.toString();
    const idB = user._id.toString();
    
    const isFriendMe = loggedInUser.friends.map(id => id.toString()).includes(idB);
    const isFriendOther = user.friends.map(id => id.toString()).includes(idA);
    const isFriend = isFriendMe && isFriendOther;

    const userOnlineStatusLevel = user.privacySettings?.onlineStatus || 'nobody';
    let canSeeThem = true;
    if (userOnlineStatusLevel === 'nobody') canSeeThem = false;
    if (userOnlineStatusLevel === 'specific_friends') {
      const allowedList = user.privacySettings?.onlineStatusAllowed || [];
      if (!allowedList.map(id => id.toString()).includes(idA)) {
        canSeeThem = false;
      }
    }

    if (!canSeeThem) {
      userObj.isOnline = false;
      delete userObj.lastSeen;
    }

    const isBlockedByMe = loggedInUser.blockedUsers.map(id => id.toString()).includes(idB);
    const isBlockedByOther = user.blockedUsers.map(id => id.toString()).includes(idA);

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
      // already handled online visibility above, but we can re-evaluate if relationship isn't friend and setting is 'specific_friends'
      if (userOnlineStatusLevel === 'specific_friends') {
        userObj.isOnline = false;
        delete userObj.lastSeen;
      }
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
    const { readReceipts, onlineStatus, onlineStatusAllowed } = req.body;
    const user = await User.findById(req.user._id);

    if (readReceipts !== undefined) {
      user.privacySettings.readReceipts = readReceipts;
    }
    
    let onlineStatusChanged = false;
    if (onlineStatus !== undefined && user.privacySettings?.onlineStatus !== onlineStatus) {
      user.privacySettings.onlineStatus = onlineStatus;
      onlineStatusChanged = true;
    }
    
    if (onlineStatusAllowed !== undefined) {
      user.privacySettings.onlineStatusAllowed = onlineStatusAllowed;
      onlineStatusChanged = true;
    }

    await user.save();

    if (onlineStatusChanged && req.io) {
      // Broadcast the change immediately so clients update chat list/profile
      req.io.except(req.user._id.toString()).emit('privacySettingsUpdated', {
        userId: user._id.toString(),
        onlineStatus: onlineStatus,
        isOnline: user.isOnline,
        lastSeen: user.lastActive || new Date()
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

export const getConnection = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { id: otherUserId } = req.params;

    if (!otherUserId) {
      return res.status(400).json({ message: "Other User ID is required" });
    }

    const sortedUsers = [loggedInUserId.toString(), otherUserId.toString()].sort();

    let connection = await Connection.findOne({
      users: sortedUsers
    });

    if (!connection) {
      connection = {
        totalScore: 0,
        chatCount: 0,
        voiceCallDuration: 0,
        videoCallDuration: 0
      };
    }

    res.status(200).json(connection);
  } catch (error) {
    console.error("Error in getConnection:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateLastViewed = async (req, res) => {
  try {
    const { section } = req.body;
    if (!['stories', 'calls', 'notifications'].includes(section)) {
      return res.status(400).json({ message: "Invalid section" });
    }

    const updateObj = {};
    updateObj[`lastViewed.${section}`] = new Date();

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateObj },
      { new: true }
    );

    res.status(200).json({ lastViewed: updatedUser.lastViewed });
  } catch (error) {
    console.error("Error in updateLastViewed:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
