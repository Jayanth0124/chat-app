import User from '../models/User.js';
import Broadcast from '../models/Broadcast.js';
import cloudinary from '../utils/cloudinary.js';

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
    const { displayName, bio, profilePic } = req.body;
    const userId = req.user._id;

    let updatedFields = {};
    if (displayName) updatedFields.displayName = displayName;
    if (bio) updatedFields.bio = bio;

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

    if (user.usernameChanges >= 3) {
      return res.status(400).json({ message: "Username can no longer be changed (limit of 3 reached)" });
    }

    if (cleanUsername === user.username) {
      return res.status(200).json(user);
    }

    const existing = await User.findOne({ username: cleanUsername });
    if (existing) {
      return res.status(400).json({ message: "Username already taken" });
    }

    user.previousUsernames.push(user.username);
    user.username = cleanUsername;
    user.usernameChanges += 1;
    await user.save();

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
