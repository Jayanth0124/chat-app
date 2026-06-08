import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';

/**
 * Validates and sanitizes the relationship state between userA and userB to ensure mutual exclusivity.
 * States can only be FRIEND, BLOCKED, PENDING_INCOMING, PENDING_OUTGOING, or NONE.
 */
export const validateAndSanitizeRelationship = async (userAId, userBId, io = null) => {
  const userA = await User.findById(userAId);
  const userB = await User.findById(userBId);
  if (!userA || !userB) return;

  const idA = userA._id.toString();
  const idB = userB._id.toString();

  const isBlockedByA = userA.blockedUsers.map(id => id.toString()).includes(idB);
  const isBlockedByB = userB.blockedUsers.map(id => id.toString()).includes(idA);

  if (isBlockedByA || isBlockedByB) {
    // BLOCKED state overrides everything else. Remove friends and requests from both documents.
    userA.friends = userA.friends.filter(id => id.toString() !== idB);
    userA.friendRequests = userA.friendRequests.filter(id => id.toString() !== idB);
    userA.sentRequests = userA.sentRequests.filter(id => id.toString() !== idB);

    userB.friends = userB.friends.filter(id => id.toString() !== idA);
    userB.friendRequests = userB.friendRequests.filter(id => id.toString() !== idA);
    userB.sentRequests = userB.sentRequests.filter(id => id.toString() !== idA);
  } else {
    const isFriendA = userA.friends.map(id => id.toString()).includes(idB);
    const isFriendB = userB.friends.map(id => id.toString()).includes(idA);

    if (isFriendA && isFriendB) {
      // FRIEND state: mutual friendship exists, clean up requests.
      userA.friendRequests = userA.friendRequests.filter(id => id.toString() !== idB);
      userA.sentRequests = userA.sentRequests.filter(id => id.toString() !== idB);

      userB.friendRequests = userB.friendRequests.filter(id => id.toString() !== idA);
      userB.sentRequests = userB.sentRequests.filter(id => id.toString() !== idA);
    } else {
      // Not mutual friends. Prune invalid one-sided friend entries.
      if (isFriendA) {
        userA.friends = userA.friends.filter(id => id.toString() !== idB);
      }
      if (isFriendB) {
        userB.friends = userB.friends.filter(id => id.toString() !== idA);
      }

      // PENDING states
      const isIncomingA = userA.friendRequests.map(id => id.toString()).includes(idB);
      const isOutgoingA = userA.sentRequests.map(id => id.toString()).includes(idB);
      const isIncomingB = userB.friendRequests.map(id => id.toString()).includes(idA);
      const isOutgoingB = userB.sentRequests.map(id => id.toString()).includes(idA);

      if (isIncomingA || isOutgoingB) {
        // B sent request to A. Ensure incoming on A's side, outgoing on B's side.
        userA.sentRequests = userA.sentRequests.filter(id => id.toString() !== idB);
        if (!isIncomingA) userA.friendRequests.push(userB._id);

        userB.friendRequests = userB.friendRequests.filter(id => id.toString() !== idA);
        if (!isOutgoingB) userB.sentRequests.push(userA._id);
      } else if (isOutgoingA || isIncomingB) {
        // A sent request to B. Ensure outgoing on A's side, incoming on B's side.
        userA.friendRequests = userA.friendRequests.filter(id => id.toString() !== idB);
        if (!isOutgoingA) userA.sentRequests.push(userB._id);

        userB.sentRequests = userB.sentRequests.filter(id => id.toString() !== idA);
        if (!isIncomingB) userB.friendRequests.push(userA._id);
      }
    }
  }

  await userA.save();
  await userB.save();

  if (io) {
    io.to(idA).emit('relationshipUpdated', { otherUserId: idB });
    io.to(idB).emit('relationshipUpdated', { otherUserId: idA });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { q: query } = req.query;
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

    const users = await User.find(searchFilter).select('username displayName profilePic');

    const queryLower = query.toLowerCase();
    users.sort((a, b) => {
      const aUsername = (a.username || '').toLowerCase();
      const bUsername = (b.username || '').toLowerCase();
      const aDisplayName = (a.displayName || '').toLowerCase();
      const bDisplayName = (b.displayName || '').toLowerCase();

      if (aUsername === queryLower && bUsername !== queryLower) return -1;
      if (bUsername === queryLower && aUsername !== queryLower) return 1;

      const aStartsWith = aUsername.startsWith(queryLower);
      const bStartsWith = bUsername.startsWith(queryLower);
      if (aStartsWith && !bStartsWith) return -1;
      if (bStartsWith && !aStartsWith) return 1;

      const aContains = aUsername.includes(queryLower);
      const bContains = bUsername.includes(queryLower);
      if (aContains && !bContains) return -1;
      if (bContains && !aContains) return 1;

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

    const isBlockedBySender = sender.blockedUsers.map(id => id.toString()).includes(userId);
    const isBlockedByRecipient = recipient.blockedUsers.map(id => id.toString()).includes(loggedInUserId.toString());

    if (isBlockedBySender || isBlockedByRecipient) {
      return res.status(400).json({ error: "Cannot send friend request: user is blocked." });
    }

    if (sender.friends.map(id => id.toString()).includes(userId)) {
      return res.status(400).json({ error: "Already friends" });
    }

    if (sender.sentRequests.map(id => id.toString()).includes(userId)) {
      return res.status(400).json({ error: "Request already sent" });
    }

    // Add friend requests
    await User.findByIdAndUpdate(userId, { $addToSet: { friendRequests: loggedInUserId } });
    await User.findByIdAndUpdate(loggedInUserId, { $addToSet: { sentRequests: userId } });

    // Validate and clean up
    await validateAndSanitizeRelationship(loggedInUserId, userId, req.io);

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
    const otherUser = await User.findById(userId);

    if (!loggedInUser.friendRequests.map(id => id.toString()).includes(userId)) {
      return res.status(400).json({ error: "No friend request from this user" });
    }

    const isBlockedByMe = loggedInUser.blockedUsers.map(id => id.toString()).includes(userId);
    const isBlockedByOther = otherUser.blockedUsers.map(id => id.toString()).includes(loggedInUserId.toString());
    if (isBlockedByMe || isBlockedByOther) {
      return res.status(400).json({ error: "Cannot accept: user is blocked" });
    }

    // Add to friends, remove request
    await User.findByIdAndUpdate(loggedInUserId, {
      $addToSet: { friends: userId },
      $pull: { friendRequests: userId }
    });

    await User.findByIdAndUpdate(userId, {
      $addToSet: { friends: loggedInUserId },
      $pull: { sentRequests: loggedInUserId }
    });

    // Run resolver to make sure state is unified and consistent
    await validateAndSanitizeRelationship(loggedInUserId, userId, req.io);

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

    await User.findByIdAndUpdate(loggedInUserId, {
      $pull: { friendRequests: userId }
    });

    await User.findByIdAndUpdate(userId, {
      $pull: { sentRequests: loggedInUserId }
    });

    await validateAndSanitizeRelationship(loggedInUserId, userId, req.io);

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
    
    const myOnlineStatusEnabled = user.privacySettings?.onlineStatus !== false;
    
    const sanitizedFriends = user.friends.map(friend => {
      const friendObj = friend.toObject();
      const friendOnlineStatusEnabled = friend.privacySettings?.onlineStatus !== false;
      
      if (!myOnlineStatusEnabled || !friendOnlineStatusEnabled) {
        friendObj.isOnline = false;
        delete friendObj.lastSeen;
      }
      return friendObj;
    });

    res.status(200).json(sanitizedFriends);
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
      
    // Sanitize incoming requests (they are not friends yet)
    const sanitizedIncoming = user.friendRequests.map(reqUser => {
      const u = reqUser.toObject();
      u.isOnline = false;
      delete u.lastSeen;
      return u;
    });

    // Sanitize outgoing requests (they are not friends yet)
    const sanitizedOutgoing = user.sentRequests.map(reqUser => {
      const u = reqUser.toObject();
      u.isOnline = false;
      delete u.lastSeen;
      return u;
    });
      
    res.status(200).json({
      incoming: sanitizedIncoming,
      outgoing: sanitizedOutgoing
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

    await User.findByIdAndUpdate(loggedInUserId, {
      $pull: { friends: userId, friendRequests: userId, sentRequests: userId }
    });
    
    await User.findByIdAndUpdate(userId, {
      $pull: { friends: loggedInUserId, friendRequests: loggedInUserId, sentRequests: loggedInUserId }
    });

    await validateAndSanitizeRelationship(loggedInUserId, userId, req.io);

    // Find and delete the one-on-one chat between these two users
    const chat = await Chat.findOne({
      isGroupChat: false,
      participants: { $all: [loggedInUserId, userId] }
    });

    if (chat) {
      const chatId = chat._id;
      await Message.deleteMany({ chat: chatId });
      await Chat.findByIdAndDelete(chatId);

      if (req.io) {
        req.io.to(loggedInUserId.toString()).emit('chatDeleted', { chatId });
        req.io.to(userId.toString()).emit('chatDeleted', { chatId });
      }
    }

    res.status(200).json({ message: "Friend removed successfully" });
  } catch (error) {
    console.error("Error in removeFriend:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const loggedInUserId = req.user._id;

    if (userId === loggedInUserId.toString()) {
      return res.status(400).json({ error: "Cannot block yourself" });
    }

    // Add to blocked list
    await User.findByIdAndUpdate(loggedInUserId, {
      $addToSet: { blockedUsers: userId }
    });

    // Resolve relationship and delete old friendship/request traces
    await validateAndSanitizeRelationship(loggedInUserId, userId, req.io);

    // Find and delete the one-on-one chat between these two users
    const chat = await Chat.findOne({
      isGroupChat: false,
      participants: { $all: [loggedInUserId, userId] }
    });

    if (chat) {
      const chatId = chat._id;
      await Message.deleteMany({ chat: chatId });
      await Chat.findByIdAndDelete(chatId);

      if (req.io) {
        req.io.to(loggedInUserId.toString()).emit('chatDeleted', { chatId });
        req.io.to(userId.toString()).emit('chatDeleted', { chatId });
      }
    }

    res.status(200).json({ message: "User blocked successfully" });
  } catch (error) {
    console.error("Error in blockUser:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const loggedInUserId = req.user._id;

    await User.findByIdAndUpdate(loggedInUserId, {
      $pull: { blockedUsers: userId }
    });

    await validateAndSanitizeRelationship(loggedInUserId, userId, req.io);

    res.status(200).json({ message: "User unblocked successfully" });
  } catch (error) {
    console.error("Error in unblockUser:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getBlockedUsers = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const user = await User.findById(loggedInUserId).populate('blockedUsers', 'username displayName profilePic');
    res.status(200).json(user.blockedUsers || []);
  } catch (error) {
    console.error("Error in getBlockedUsers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
