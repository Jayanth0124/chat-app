import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Report from '../models/Report.js';
import cloudinary, { deleteFromCloudinary } from '../utils/cloudinary.js';
import { sendPushNotification } from '../utils/webPush.js';
import Connection from '../models/Connection.js';

export const accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "UserId param not sent with request" });
  }

  try {
    const loggedInUserId = req.user._id;

    const loggedInUser = await User.findById(loggedInUserId);
    const recipient = await User.findById(userId);

    if (!recipient) {
      return res.status(404).json({ message: "User not found" });
    }

    if (recipient.status === 'banned') {
      return res.status(403).json({ message: "Cannot message banned users." });
    }

    const isBlocked = loggedInUser.blockedUsers.map(id => id.toString()).includes(userId.toString()) || 
                      recipient.blockedUsers.map(id => id.toString()).includes(loggedInUserId.toString());
    if (isBlocked) {
      return res.status(403).json({ message: "Cannot message blocked users." });
    }

    const areFriends = loggedInUser.friends.map(id => id.toString()).includes(userId.toString()) && 
                       recipient.friends.map(id => id.toString()).includes(loggedInUserId.toString());
    if (!areFriends) {
      return res.status(403).json({ message: "You can only message accepted friends." });
    }

    let isChat = await Chat.find({
      isGroupChat: false,
      $and: [
        { participants: { $elemMatch: { $eq: req.user._id } } },
        { participants: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate("participants", "-password")
      .populate("latestMessage");

    isChat = await User.populate(isChat, {
      path: "latestMessage.sender",
      select: "displayName profilePic email",
    });

    if (isChat.length > 0) {
      res.send(isChat[0]);
    } else {
      var chatData = {
        groupName: "sender",
        isGroupChat: false,
        participants: [req.user._id, userId],
      };

      const createdChat = await Chat.create(chatData);
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "participants",
        "-password"
      );
      res.status(200).json(FullChat);
    }
  } catch (error) {
    console.log("Error in accessChat:", error);
    res.status(400).json({ message: error.message });
  }
};

export const fetchChats = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Prune expired messages first
    const expiredMessages = await Message.find({ expiresAt: { $lte: new Date() } });
    if (expiredMessages.length > 0) {
      for (const msg of expiredMessages) {
        if (msg.mediaUrl) await deleteFromCloudinary(msg.mediaUrl);
      }
      await Message.deleteMany({ _id: { $in: expiredMessages.map(m => m._id) } });
    }

    let results = await Chat.find({ participants: { $elemMatch: { $eq: loggedInUserId } } })
      .populate('participants', '-password')
      .populate('groupAdmin', '-password')
      .populate('latestMessage')
      .sort({ updatedAt: -1 });

    results = await User.populate(results, {
      path: 'latestMessage.sender',
      select: 'displayName profilePic email',
    });

    // Compute unread count per chat and scrub online status based on privacy
    const chatsWithUnread = await Promise.all(
      results.map(async (chat) => {
        const unreadCount = await Message.countDocuments({
          chat: chat._id,
          sender: { $ne: loggedInUserId },
          status: { $ne: 'seen' }
        });
        
        const chatObj = chat.toObject();
        chatObj.participants = chatObj.participants.map(p => {
          if (p.privacySettings?.onlineStatus === false) {
            return { ...p, isOnline: false, lastSeen: undefined };
          }
          return p;
        });

        return { ...chatObj, unreadCount };
      })
    );

    res.status(200).json(chatsWithUnread);
  } catch (error) {
    console.log('Error in fetchChats:', error);
    res.status(400).json({ message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  const { content, chatId, mediaUrl, messageType, isViewOnce, replyTo, mediaSource } = req.body;

  if (!chatId || (!content && !mediaUrl)) {
    return res.status(400).json({ message: "Invalid data passed into request" });
  }

  try {
    const loggedInUserId = req.user._id;
    const chat = await Chat.findById(chatId).populate("participants");
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Enforce friendship, blocked, and ban checks
    const otherUser = chat.participants.find(p => p._id.toString() !== loggedInUserId.toString());
    if (otherUser && !chat.isGroupChat) {
      const senderUser = await User.findById(loggedInUserId);
      const recipientUser = await User.findById(otherUser._id);
      
      if (recipientUser.status === 'banned') {
        return res.status(403).json({ message: "Cannot message banned users." });
      }
      if (senderUser.blockedUsers.map(id => id.toString()).includes(otherUser._id.toString()) || 
          recipientUser.blockedUsers.map(id => id.toString()).includes(loggedInUserId.toString())) {
        return res.status(403).json({ message: "Cannot message blocked users." });
      }
      const areFriends = senderUser.friends.map(id => id.toString()).includes(otherUser._id.toString()) && 
                         recipientUser.friends.map(id => id.toString()).includes(loggedInUserId.toString());
      if (!areFriends) {
        return res.status(403).json({ message: "You can only message accepted friends." });
      }
    }

    // Determine status (delivered if online, sent if offline)
    let status = 'sent';
    if (otherUser && req.io) {
      const recipientSocketRoom = req.io.sockets.adapter.rooms.get(otherUser._id.toString());
      if (recipientSocketRoom && recipientSocketRoom.size > 0) {
        status = 'delivered';
      }
    }

    // Default expiration is 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    let secureMediaUrl = mediaUrl || null;
    let computedMessageType = messageType || "text";

    if (["image", "video", "document", "audio", "snap"].includes(computedMessageType) && secureMediaUrl && secureMediaUrl.startsWith("data:")) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(secureMediaUrl, {
          resource_type: "auto"
        });
        secureMediaUrl = uploadResponse.secure_url;
      } catch (err) {
        console.error("Cloudinary upload error:", err);
        return res.status(500).json({ message: "Failed to upload media" });
      }
    }

    var newMessage = {
      sender: loggedInUserId,
      content: content || "",
      chat: chatId,
      messageType: computedMessageType,
      mediaUrl: secureMediaUrl,
      mediaSource: computedMessageType === 'snap' ? mediaSource : null,
      isViewOnce: isViewOnce || false,
      status: status,
      expiresAt,
      replyTo: replyTo || null
    };

    let message = await Message.create(newMessage);

    message = await message.populate("sender", "displayName profilePic");
    message = await message.populate("chat");
    message = await message.populate({
      path: "replyTo",
      populate: { path: "sender", select: "displayName profilePic" }
    });
    message = await User.populate(message, {
      path: "chat.participants",
      select: "displayName profilePic email",
    });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

    // Send background push notifications to other participants in parallel
    if (message.chat && message.chat.participants) {
      message.chat.participants.forEach(async (participant) => {
        const participantId = participant._id.toString();
        if (participantId !== loggedInUserId.toString()) {
          const isVanishMode = message.isViewOnce || (message.chat && message.chat.vanishMode && message.chat.vanishMode !== 'OFF');
          const pushBody = isVanishMode 
            ? 'New Vanish Mode Message' 
            : message.messageType === 'image' 
              ? '📷 Photo' 
              : message.content;

          await sendPushNotification(participantId, {
            title: message.sender.displayName || 'New Message',
            body: pushBody,
            icon: message.sender.profilePic || '/logo.png',
            data: {
              url: `/chat/${chatId}`,
              chatId
            }
          });
        }
      });
    }

    // Update Orbit Connection Score
    if (!chat.isGroupChat && chat.participants.length === 2) {
      const otherUser = chat.participants.find(p => p._id.toString() !== loggedInUserId.toString());
      if (otherUser) {
        const otherUserId = otherUser._id;
        const scoreIncrement = (computedMessageType === 'audio' || computedMessageType === 'video' || computedMessageType === 'image' || computedMessageType === 'snap') ? 2 : 1;

        const sortedUsers = [loggedInUserId.toString(), otherUserId.toString()].sort();

        await Connection.findOneAndUpdate(
          { users: sortedUsers },
          { 
            $inc: { totalScore: scoreIncrement, chatCount: 1 }
          },
          { upsert: true, new: true }
        );
      }
    }

    res.json(message);
  } catch (error) {
    console.log("Error in sendMessage:", error);
    res.status(400).json({ message: error.message });
  }
};

export const fetchMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    // Prune any expired messages from this chat
    const expiredChatMsgs = await Message.find({
      chat: chatId,
      expiresAt: { $lte: new Date() }
    });
    if (expiredChatMsgs.length > 0) {
      for (const msg of expiredChatMsgs) {
        if (msg.mediaUrl) await deleteFromCloudinary(msg.mediaUrl);
      }
      await Message.deleteMany({ _id: { $in: expiredChatMsgs.map(m => m._id) } });
    }

    // Snapchat/Instagram Vanish Mode logic:
    // If a viewOnce message has already been 'seen', it should vanish upon chat reload.
    // We delete it from the DB before fetching, so neither user sees it again.
    const vanishedMsgs = await Message.find({
      chat: chatId,
      isViewOnce: true,
      status: 'seen'
    });
    if (vanishedMsgs.length > 0) {
      for (const msg of vanishedMsgs) {
        if (msg.mediaUrl) await deleteFromCloudinary(msg.mediaUrl);
      }
      await Message.deleteMany({ _id: { $in: vanishedMsgs.map(m => m._id) } });
    }

    let messages = await Message.find({ 
      chat: chatId,
      deletedFor: { $ne: req.user._id }
    })
      .populate("sender", "displayName profilePic email privacySettings")
      .populate({
        path: "chat",
        populate: { path: "participants", select: "privacySettings" }
      })
      .populate({
        path: "replyTo",
        populate: { path: "sender", select: "displayName profilePic" }
      });

    // Enforce Read Receipts Privacy
    const loggedInUserId = req.user._id;
    const loggedInUser = await User.findById(loggedInUserId);
    const myReadReceipts = loggedInUser?.privacySettings?.readReceipts !== false;

    if (messages.length > 0 && messages[0].chat && !messages[0].chat.isGroupChat) {
      const otherUser = messages[0].chat.participants.find(p => p._id.toString() !== loggedInUserId.toString());
      const otherReadReceipts = otherUser?.privacySettings?.readReceipts !== false;

      if (!myReadReceipts || !otherReadReceipts) {
        messages = messages.map(msg => {
          const msgObj = msg.toObject();
          // If I sent the message and it's marked as seen, but read receipts are off, show as delivered
          if (msgObj.sender._id.toString() === loggedInUserId.toString() && msgObj.status === 'seen') {
            msgObj.status = 'delivered';
          }
          return msgObj;
        });
      }
    }

    res.json(messages);
  } catch (error) {
    console.log("Error in fetchMessages:", error);
    res.status(400).json({ message: error.message });
  }
};

export const viewOnceMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const loggedInUserId = req.user._id;
    
    // Find message and ensure it is view-once
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (!message.isViewOnce && message.messageType !== 'snap') {
      return res.status(400).json({ message: "Not a view-once or snap message" });
    }

    if (message.isViewed || message.opened) {
      return res.status(400).json({ message: "Message already viewed" });
    }

    // Replace the content with a placeholder and mark as viewed/opened
    if (message.messageType === 'snap') {
      if (message.mediaUrl) await deleteFromCloudinary(message.mediaUrl);
      message.opened = true;
      message.openedAt = new Date();
      message.content = "Opened";
      message.mediaUrl = null;
      message.expiresAt = new Date(); // Expire immediately for cleanup
    } else {
      if (message.mediaUrl) await deleteFromCloudinary(message.mediaUrl);
      message.isViewed = true;
      message.content = "Message Opened";
      message.mediaUrl = null;
      message.expiresAt = new Date(); // Expire immediately so it is pruned on next load
    }
    await message.save();

    // Populate the required fields to send back exactly like a normal message
    await message.populate("sender", "displayName profilePic email");
    await message.populate("chat");

    if (req.io) {
      req.io.to(message.chat._id.toString()).emit('messagesSeen', {
        chatId: message.chat._id.toString(),
        seenBy: loggedInUserId,
        updatedMessages: [{
          _id: message._id,
          status: 'seen',
          content: message.content,
          mediaUrl: message.mediaUrl,
          isViewed: message.isViewed,
          opened: message.opened,
          openedAt: message.openedAt,
          expiresAt: message.expiresAt
        }]
      });
    }

    res.status(200).json(message);
  } catch (error) {
    console.error("Error in viewOnceMessage:", error);
    res.status(500).json({ message: "Failed to mark message as viewed" });
  }
};

export const markChatAsSeen = async (req, res) => {
  try {
    const { chatId } = req.params;
    const loggedInUserId = req.user._id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const unseenMessages = await Message.find({
      chat: chatId,
      sender: { $ne: loggedInUserId },
      status: { $ne: 'seen' }
    });

    for (let msg of unseenMessages) {
      msg.status = 'seen';

      if (msg.isViewOnce || chat.vanishMode === 'VIEW ONCE') {
        msg.isViewOnce = true;
        // Keep isViewed = false and content intact!
      } else if (chat.vanishMode === '10 SECONDS') {
        msg.expiresAt = new Date(Date.now() + 10 * 1000);
      } else if (chat.vanishMode === '1 MINUTE') {
        msg.expiresAt = new Date(Date.now() + 60 * 1000);
      }

      await msg.save();
    }

    const updatedMessages = unseenMessages.map(msg => ({
      _id: msg._id,
      status: 'seen',
      expiresAt: msg.expiresAt,
      content: msg.content,
      mediaUrl: msg.mediaUrl,
      isViewed: msg.isViewed,
      isViewOnce: msg.isViewOnce
    }));

    const loggedInUser = await User.findById(loggedInUserId);
    const myReadReceipts = loggedInUser?.privacySettings?.readReceipts !== false;
    
    let otherReadReceipts = true;
    if (!chat.isGroupChat) {
      const otherUser = await User.findById(chat.participants.find(p => p.toString() !== loggedInUserId.toString()));
      otherReadReceipts = otherUser?.privacySettings?.readReceipts !== false;
    }

    // Only broadcast the 'seen' event to the sender if both parties allow read receipts
    if (req.io && myReadReceipts && otherReadReceipts) {
      req.io.to(chatId).emit('messagesSeen', {
        chatId,
        seenBy: loggedInUserId,
        updatedMessages
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in markChatAsSeen:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateVanishMode = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { vanishMode } = req.body;

    if (!['OFF', 'VIEW ONCE', '10 SECONDS', '1 MINUTE'].includes(vanishMode)) {
      return res.status(400).json({ message: "Invalid vanish mode value" });
    }

    const chat = await Chat.findByIdAndUpdate(
      chatId,
      { vanishMode },
      { new: true }
    ).populate("participants", "-password");

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (req.io) {
      req.io.to(chatId).emit('vanishModeChanged', { chatId, vanishMode });
    }

    res.status(200).json(chat);
  } catch (error) {
    console.error("Error in updateVanishMode:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const loggedInUserId = req.user._id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (!chat.participants.map(p => p.toString()).includes(loggedInUserId.toString())) {
      return res.status(403).json({ message: "You are not authorized to delete this chat" });
    }

    // Clean up all Cloudinary media associated with this chat
    const messagesWithMedia = await Message.find({ chat: chatId, mediaUrl: { $ne: null } });
    if (messagesWithMedia.length > 0) {
      for (const msg of messagesWithMedia) {
        if (msg.mediaUrl) await deleteFromCloudinary(msg.mediaUrl);
      }
    }

    await Message.deleteMany({ chat: chatId });
    await Chat.findByIdAndDelete(chatId);

    if (req.io) {
      chat.participants.forEach(participantId => {
        req.io.to(participantId.toString()).emit('chatDeleted', { chatId });
      });
    }

    res.status(200).json({ message: "Chat deleted successfully", chatId });
  } catch (error) {
    console.error("Error in deleteChat:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const reportMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { reason, details } = req.body;
    const reporterId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const existingReport = await Report.findOne({ reporter: reporterId, reportedMessage: messageId });
    if (existingReport) {
      return res.status(400).json({ message: "You have already reported this message." });
    }

    const report = await Report.create({
      reporter: reporterId,
      reportedMessage: messageId,
      reportedUser: message.sender,
      reason: reason || 'Other',
      details: details || ''
    });

    res.status(201).json({ message: "Message reported successfully", report });
  } catch (error) {
    console.error("Error in reportMessage:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const loggedInUserId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Only sender can delete their message
    if (message.sender.toString() !== loggedInUserId.toString()) {
      return res.status(403).json({ message: "You can only delete your own messages." });
    }

    // Delete media from Cloudinary if it exists
    if (message.mediaUrl) {
      await deleteFromCloudinary(message.mediaUrl);
    }

    await Message.findByIdAndDelete(messageId);

    // Emit socket event to notify other clients in the chat room
    if (req.io) {
      const chat = await Chat.findById(message.chat);
      if (chat) {
        chat.participants.forEach(participantId => {
          req.io.to(participantId.toString()).emit('messageDeleted', { messageId, chatId: message.chat.toString() });
        });
      }
    }

    res.status(200).json({ message: "Message deleted successfully", messageId });
  } catch (error) {
    console.error("Error in deleteMessage:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const unsendMessage = async (req, res) => {
  try {
    const { messageIds } = req.body;
    const loggedInUserId = req.user._id;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ message: "No messages provided" });
    }

    const messages = await Message.find({ _id: { $in: messageIds } });
    if (messages.length === 0) {
      return res.status(404).json({ message: "Messages not found" });
    }

    let chatId = null;
    let unsentIds = [];

    for (const msg of messages) {
      // Only sender can unsend
      if (msg.sender.toString() === loggedInUserId.toString()) {
        chatId = msg.chat;
        msg.isUnsent = true;
        // Delete media from Cloudinary if it exists
        if (msg.mediaUrl) {
          await deleteFromCloudinary(msg.mediaUrl);
        }
        msg.mediaUrl = null;
        msg.content = ""; // Content will be replaced in UI
        await msg.save();
        unsentIds.push(msg._id.toString());
      }
    }

    // Emit socket event to notify other clients in the chat room
    if (req.io && chatId && unsentIds.length > 0) {
      const chat = await Chat.findById(chatId);
      if (chat) {
        chat.participants.forEach(participantId => {
          req.io.to(participantId.toString()).emit('messagesUnsent', { messageIds: unsentIds, chatId: chatId.toString() });
        });
      }
    }

    res.status(200).json({ message: "Messages unsent successfully", unsentIds });
  } catch (error) {
    console.error("Error in unsendMessage:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteMessagesForMe = async (req, res) => {
  try {
    const { messageIds } = req.body;
    const loggedInUserId = req.user._id;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ message: "No messages provided" });
    }

    await Message.updateMany(
      { _id: { $in: messageIds } },
      { $addToSet: { deletedFor: loggedInUserId } }
    );

    res.status(200).json({ message: "Messages deleted for you successfully", deletedIds: messageIds });
  } catch (error) {
    console.error("Error in deleteMessagesForMe:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const markChatAsUnread = async (req, res) => {
  try {
    const { chatId } = req.params;
    const loggedInUserId = req.user._id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Find the latest message in this chat from the other user
    const latestMsgFromOther = await Message.findOne({
      chat: chatId,
      sender: { $ne: loggedInUserId }
    }).sort({ createdAt: -1 });

    if (latestMsgFromOther) {
      latestMsgFromOther.status = 'delivered'; // mark as not seen
      await latestMsgFromOther.save();
      
      // Notify the client to show as unread
      if (req.io) {
        req.io.to(loggedInUserId.toString()).emit('chatMarkedUnread', { chatId });
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in markChatAsUnread:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const pinChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { pin } = req.body; // boolean
    const loggedInUserId = req.user._id;

    const user = await User.findById(loggedInUserId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (pin) {
      if (!user.pinnedChats.includes(chatId)) {
        user.pinnedChats.push(chatId);
      }
    } else {
      user.pinnedChats = user.pinnedChats.filter(id => id.toString() !== chatId);
    }

    await user.save();
    res.status(200).json({ success: true, pinnedChats: user.pinnedChats });
  } catch (error) {
    console.error("Error in pinChat:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const muteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { durationHours } = req.body; // 8, 168 (1 week), or null (always)
    const loggedInUserId = req.user._id;

    const user = await User.findById(loggedInUserId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Remove existing mute for this chat if any
    user.mutedChats = user.mutedChats.filter(m => m.chatId.toString() !== chatId);

    if (durationHours !== undefined && durationHours !== false) {
      let mutedUntil = null;
      if (durationHours !== null) {
        mutedUntil = new Date(Date.now() + durationHours * 60 * 60 * 1000);
      }
      user.mutedChats.push({ chatId, mutedUntil });
    }

    await user.save();
    res.status(200).json({ success: true, mutedChats: user.mutedChats });
  } catch (error) {
    console.error("Error in muteChat:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
