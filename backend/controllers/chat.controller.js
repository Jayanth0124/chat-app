import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import cloudinary from '../utils/cloudinary.js';

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

    if (loggedInUser.blockedUsers.includes(userId) || recipient.blockedUsers.includes(loggedInUserId)) {
      return res.status(403).json({ message: "Cannot message blocked users." });
    }

    const areFriends = loggedInUser.friends.includes(userId) && recipient.friends.includes(loggedInUserId);
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
    await Message.deleteMany({ expiresAt: { $lte: new Date() } });

    let results = await Chat.find({ participants: { $elemMatch: { $eq: loggedInUserId } } })
      .populate('participants', '-password')
      .populate('groupAdmin', '-password')
      .populate('latestMessage')
      .sort({ updatedAt: -1 });

    results = await User.populate(results, {
      path: 'latestMessage.sender',
      select: 'displayName profilePic email',
    });

    // Compute unread count per chat (messages not sent by me and not yet seen)
    const chatsWithUnread = await Promise.all(
      results.map(async (chat) => {
        const unreadCount = await Message.countDocuments({
          chat: chat._id,
          sender: { $ne: loggedInUserId },
          status: { $ne: 'seen' }
        });
        return { ...chat.toObject(), unreadCount };
      })
    );

    res.status(200).json(chatsWithUnread);
  } catch (error) {
    console.log('Error in fetchChats:', error);
    res.status(400).json({ message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  const { content, chatId, mediaUrl, messageType, isViewOnce } = req.body;

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
      if (senderUser.blockedUsers.includes(otherUser._id) || recipientUser.blockedUsers.includes(loggedInUserId)) {
        return res.status(403).json({ message: "Cannot message blocked users." });
      }
      const areFriends = senderUser.friends.includes(otherUser._id) && recipientUser.friends.includes(loggedInUserId);
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

    if (computedMessageType === "image" && secureMediaUrl && secureMediaUrl.startsWith("data:")) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(secureMediaUrl);
        secureMediaUrl = uploadResponse.secure_url;
      } catch (err) {
        console.error("Cloudinary upload error:", err);
        return res.status(500).json({ message: "Failed to upload image" });
      }
    }

    var newMessage = {
      sender: loggedInUserId,
      content: content || "",
      chat: chatId,
      messageType: computedMessageType,
      mediaUrl: secureMediaUrl,
      isViewOnce: isViewOnce || false,
      status,
      expiresAt
    };

    let message = await Message.create(newMessage);

    message = await message.populate("sender", "displayName profilePic");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.participants",
      select: "displayName profilePic email",
    });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

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
    await Message.deleteMany({
      chat: chatId,
      expiresAt: { $lte: new Date() }
    });

    const messages = await Message.find({ chat: chatId })
      .populate("sender", "displayName profilePic email")
      .populate("chat");

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

    if (!message.isViewOnce) {
      return res.status(400).json({ message: "Not a view-once message" });
    }

    if (message.isViewed) {
      return res.status(400).json({ message: "Message already viewed" });
    }

    // Replace the content with a placeholder and mark as viewed
    message.isViewed = true;
    message.content = "Message Opened";
    message.mediaUrl = null;
    message.expiresAt = new Date(); // Expire immediately so it is pruned on next load
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

    if (req.io) {
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
