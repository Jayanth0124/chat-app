import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';

export const searchUsers = async (req, res) => {
  try {
    const { q: query } = req.query; // frontend sends ?q=...
    const loggedInUserId = req.user._id;

    if (!query || !query.trim()) {
      return res.status(200).json([]);
    }

    const currentUser = await User.findById(loggedInUserId);
    const blockedByMe = currentUser.blockedUsers || [];

    const searchFilter = {
      _id: { $ne: loggedInUserId, $nin: blockedByMe },
      blockedUsers: { $ne: loggedInUserId },
      status: { $ne: 'banned' },
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { displayName: { $regex: query, $options: 'i' } }
      ]
    };

    if (currentUser.role !== 'admin') {
      searchFilter.role = { $ne: 'admin' };
    }

    // Search by username or displayName, case-insensitive, excluding blocked/banned/admin relationships
    const users = await User.find(searchFilter).select('username displayName profilePic');

    const queryLower = query.toLowerCase();
    users.sort((a, b) => {
      const aUsername = (a.username || '').toLowerCase();
      const bUsername = (b.username || '').toLowerCase();
      const aDisplayName = (a.displayName || '').toLowerCase();
      const bDisplayName = (b.displayName || '').toLowerCase();

      // 1. Exact username match
      if (aUsername === queryLower && bUsername !== queryLower) return -1;
      if (bUsername === queryLower && aUsername !== queryLower) return 1;

      // 2. Partial username match (starts with)
      const aStartsWith = aUsername.startsWith(queryLower);
      const bStartsWith = bUsername.startsWith(queryLower);
      if (aStartsWith && !bStartsWith) return -1;
      if (bStartsWith && !aStartsWith) return 1;

      const aContains = aUsername.includes(queryLower);
      const bContains = bUsername.includes(queryLower);
      if (aContains && !bContains) return -1;
      if (bContains && !aContains) return 1;

      // 3. Display name match
      const aDNStartsWith = aDisplayName.startsWith(queryLower);
      const bDNStartsWith = bDisplayName.startsWith(queryLower);
      if (aDNStartsWith && !bDNStartsWith) return -1;
      if (bDNStartsWith && !aDNStartsWith) return 1;

      return 0;
    });

    res.status(200).json(users);
  } catch (error) {
    console.error("Error in searchUsers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const loggedInUserId = req.user._id;

    if (userId === loggedInUserId.toString()) {
      return res.status(400).json({ error: "Cannot send request to yourself" });
    }

    const recipient = await User.findById(userId);
    const sender = await User.findById(loggedInUserId);

    if (!recipient) {
      return res.status(404).json({ error: "User not found" });
    }

    if (sender.friends.includes(userId)) {
      return res.status(400).json({ error: "Already friends" });
    }

    if (sender.sentRequests.includes(userId)) {
      return res.status(400).json({ error: "Request already sent" });
    }

    if (sender.blockedUsers.includes(userId) || recipient.blockedUsers.includes(loggedInUserId)) {
      return res.status(400).json({ error: "Cannot send friend request: user is blocked." });
    }

    // Update recipient's friendRequests and sender's sentRequests
    await User.findByIdAndUpdate(userId, { $addToSet: { friendRequests: loggedInUserId } });
    await User.findByIdAndUpdate(loggedInUserId, { $addToSet: { sentRequests: userId } });

    // Emit real-time notification to recipient
    if (req.io) {
      const senderData = await User.findById(loggedInUserId).select('displayName profilePic username');
      req.io.to(userId.toString()).emit('friendRequestReceived', {
        from: senderData,
        message: `${senderData.displayName} sent you a friend request`
      });
    }

    res.status(200).json({ message: "Friend request sent successfully" });
  } catch (error) {
    console.error("Error in sendFriendRequest:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const loggedInUserId = req.user._id;

    const loggedInUser = await User.findById(loggedInUserId);

    if (!loggedInUser.friendRequests.includes(userId)) {
      return res.status(400).json({ error: "No friend request from this user" });
    }

    // Add to friends, remove from requests
    await User.findByIdAndUpdate(loggedInUserId, {
      $addToSet: { friends: userId },
      $pull: { friendRequests: userId }
    });

    await User.findByIdAndUpdate(userId, {
      $addToSet: { friends: loggedInUserId },
      $pull: { sentRequests: loggedInUserId }
    });

    // Emit real-time notification to the original sender
    if (req.io) {
      const accepterData = await User.findById(loggedInUserId).select('displayName profilePic username');
      req.io.to(userId.toString()).emit('friendRequestAccepted', {
        from: accepterData,
        message: `${accepterData.displayName} accepted your friend request`
      });
    }

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.error("Error in acceptFriendRequest:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const rejectFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const loggedInUserId = req.user._id;

    // Remove from requests
    await User.findByIdAndUpdate(loggedInUserId, {
      $pull: { friendRequests: userId }
    });

    await User.findByIdAndUpdate(userId, {
      $pull: { sentRequests: loggedInUserId }
    });

    res.status(200).json({ message: "Friend request rejected" });
  } catch (error) {
    console.error("Error in rejectFriendRequest:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getFriends = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const user = await User.findById(loggedInUserId).populate('friends', '-password');
    res.status(200).json(user.friends);
  } catch (error) {
    console.error("Error in getFriends:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getPendingRequests = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const user = await User.findById(loggedInUserId)
      .populate('friendRequests', '-password')
      .populate('sentRequests', '-password');
      
    res.status(200).json({
      incoming: user.friendRequests,
      outgoing: user.sentRequests
    });
  } catch (error) {
    console.error("Error in getPendingRequests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const removeFriend = async (req, res) => {
  try {
    const { userId } = req.params;
    const loggedInUserId = req.user._id;

    // Remove each other from friends array
    await User.findByIdAndUpdate(loggedInUserId, {
      $pull: { friends: userId }
    });
    
    await User.findByIdAndUpdate(userId, {
      $pull: { friends: loggedInUserId }
    });

    // Find and delete the one-on-one chat between these two users
    const chat = await Chat.findOne({
      isGroupChat: false,
      participants: { $all: [loggedInUserId, userId] }
    });

    if (chat) {
      const chatId = chat._id;
      await Message.deleteMany({ chat: chatId });
      await Chat.findByIdAndDelete(chatId);

      // Notify both via socket so it immediately vanishes from their lists
      if (req.io) {
        req.io.to(loggedInUserId.toString()).emit('chatDeleted', { chatId });
        req.io.to(userId.toString()).emit('chatDeleted', { chatId });
      }
    }

    res.status(200).json({ message: "Friend removed and conversation deleted successfully" });
  } catch (error) {
    console.error("Error in removeFriend:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const loggedInUserId = req.user._id;

    // Remove from friends and requests, add to blockedUsers
    await User.findByIdAndUpdate(loggedInUserId, {
      $pull: { friends: userId, friendRequests: userId, sentRequests: userId },
      $addToSet: { blockedUsers: userId }
    });
    
    await User.findByIdAndUpdate(userId, {
      $pull: { friends: loggedInUserId, friendRequests: loggedInUserId, sentRequests: loggedInUserId }
    });

    // Find and delete the one-on-one chat between these two users
    const chat = await Chat.findOne({
      isGroupChat: false,
      participants: { $all: [loggedInUserId, userId] }
    });

    if (chat) {
      const chatId = chat._id;
      await Message.deleteMany({ chat: chatId });
      await Chat.findByIdAndDelete(chatId);

      // Notify both via socket so it immediately vanishes from their lists
      if (req.io) {
        req.io.to(loggedInUserId.toString()).emit('chatDeleted', { chatId });
        req.io.to(userId.toString()).emit('chatDeleted', { chatId });
      }
    }

    res.status(200).json({ message: "User blocked and conversation deleted successfully" });
  } catch (error) {
    console.error("Error in blockUser:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
