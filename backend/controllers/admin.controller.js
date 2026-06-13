import mongoose from 'mongoose';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import cloudinary, { deleteFromCloudinary } from '../utils/cloudinary.js';
import AuditLog from '../models/AuditLog.js';
import Report from '../models/Report.js';
import SecurityLog from '../models/SecurityLog.js';
import Broadcast from '../models/Broadcast.js';
import Notification from '../models/Notification.js';
import Setting from '../models/Setting.js';
import UsernameChangeRequest from '../models/UsernameChangeRequest.js';
import bcrypt from 'bcrypt';
import Call from '../models/Call.js';
import { sendPushNotification } from '../utils/webPush.js';

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const onlineUsers = await User.countDocuments({ isOnline: true });
    const messagesSent = await Message.countDocuments();
    const reportsSubmitted = await Report.countDocuments();
    const bannedUsers = await User.countDocuments({ status: 'banned' });
    const totalChats = await Chat.countDocuments();

    const friendRequestsRes = await User.aggregate([
      { $project: { count: { $size: { $ifNull: ["$friendRequests", []] } } } },
      { $group: { _id: null, total: { $sum: "$count" } } }
    ]);
    const friendRequests = friendRequestsRes[0]?.total || 0;

    const totalVoiceCalls = await Call.countDocuments({ type: 'voice' });
    const totalVideoCalls = await Call.countDocuments({ type: 'video' });

    res.status(200).json({
      totalUsers,
      activeUsers,
      onlineUsers,
      messagesSent,
      friendRequests,
      reportsSubmitted,
      bannedUsers,
      totalChats,
      totalVoiceCalls,
      totalVideoCalls
    });
  } catch (error) {
    console.log("Error in getDashboardStats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    console.log("Error in getAllUsers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const previousStatus = user.status;
    const newStatus = previousStatus === 'active' ? 'banned' : 'active';
    
    // Toggle ban status
    user.status = newStatus;
    await user.save();

    // Create Audit Log
    const action = newStatus === 'banned' ? 'BAN_USER' : 'UNBAN_USER';
    await AuditLog.create({
      adminId: req.user._id,
      action: action,
      targetId: user._id,
      targetModel: 'User',
      details: `${action} executed for user ${user.username} (Email: ${user.email}). Status changed from ${previousStatus} to ${newStatus}.`
    });

    res.status(200).json({ message: `User status changed to ${user.status}`, user });
  } catch (error) {
    console.log("Error in banUser:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    await User.findByIdAndDelete(userId);

    // Create Audit Log
    await AuditLog.create({
      adminId: req.user._id,
      action: 'DELETE_USER',
      targetId: userId,
      targetModel: 'User',
      details: `User ${user.username} (Email: ${user.email}) was deleted permanently.`
    });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.log("Error in deleteUser:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('adminId', 'username displayName email')
      .sort({ createdAt: -1 });
    res.status(200).json(logs);
  } catch (error) {
    console.log("Error in getAuditLogs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('reporter', 'displayName username profilePic email')
      .populate('reportedUser', 'displayName username profilePic email')
      .populate('reportedMessage')
      .sort({ createdAt: -1 });
    res.status(200).json(reports);
  } catch (error) {
    console.log("Error in getReports:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body; // 'resolved' or 'dismissed'

    if (!['resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ message: "Report not found" });

    report.status = status;
    await report.save();

    // Create Audit Log
    const action = status === 'resolved' ? 'RESOLVE_REPORT' : 'DISMISS_REPORT';
    await AuditLog.create({
      adminId: req.user._id,
      action: action,
      targetId: report._id,
      targetModel: 'Message',
      details: `${action} executed for report ID ${report._id}.`
    });

    res.status(200).json({ message: `Report marked as ${status}`, report });
  } catch (error) {
    console.log("Error in updateReportStatus:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteMessageByAdmin = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    // Delete media from Cloudinary if it exists
    if (message.mediaUrl) {
      await deleteFromCloudinary(message.mediaUrl);
    }

    await Message.findByIdAndDelete(messageId);

    // Create Audit Log
    await AuditLog.create({
      adminId: req.user._id,
      action: 'MODERATION_DELETE_MESSAGE',
      targetId: message._id,
      targetModel: 'Message',
      details: `Admin deleted message ID ${messageId} containing: "${message.content?.substring(0, 50)}"`
    });

    // Notify clients
    if (req.io) {
      const chat = await Chat.findById(message.chat);
      if (chat) {
        chat.participants.forEach(participantId => {
          req.io.to(participantId.toString()).emit('messageDeleted', { messageId, chatId: message.chat.toString() });
        });
      }
    }

    res.status(200).json({ message: "Message deleted successfully by admin" });
  } catch (error) {
    console.log("Error in deleteMessageByAdmin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getSecurityLogs = async (req, res) => {
  try {
    const logs = await SecurityLog.find().sort({ createdAt: -1 });
    res.status(200).json(logs);
  } catch (error) {
    console.error("Error in getSecurityLogs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const blockIP = async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip) {
      return res.status(400).json({ message: "IP address is required" });
    }

    // Update status to blocked for matching logs
    await SecurityLog.updateMany({ ip }, { $set: { status: 'blocked' } });

    // Log admin audit
    await AuditLog.create({
      adminId: req.user._id,
      action: 'BLOCK_IP',
      targetId: req.user._id, // placeholder target ID
      targetModel: 'User',
      details: `Admin blocked IP address: ${ip}`
    });

    res.status(200).json({ message: `IP address ${ip} successfully blocked` });
  } catch (error) {
    console.error("Error in blockIP:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getSettings = async (req, res) => {
  try {
    const settings = await Setting.find();
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
    res.status(200).json(settingsMap);
  } catch (error) {
    console.log("Error in getSettings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateSetting = async (req, res) => {
  try {
    const { key, value } = req.body;
    await Setting.findOneAndUpdate(
      { key },
      { value },
      { upsert: true, new: true }
    );
    res.status(200).json({ message: "Setting updated successfully" });
  } catch (error) {
    console.log("Error in updateSetting:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendBroadcast = async (req, res) => {
  try {
    const { audience, message, isPermanent, targetUserId } = req.body;
    if (!message) {
      return res.status(400).json({ message: "Message content is required" });
    }

    if (audience === 'Specific User' && !targetUserId) {
      return res.status(400).json({ message: "Target user is required for Specific User audience" });
    }

    const expiresAt = isPermanent 
      ? null 
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

    // If specific user, fetch them to add their name to the audience label
    let finalAudience = audience || 'All Users';
    let targetUserObj = null;
    
    if (audience === 'Specific User') {
      targetUserObj = await User.findById(targetUserId);
      if (!targetUserObj) return res.status(404).json({ message: "Target user not found" });
      finalAudience = `User: ${targetUserObj.displayName || targetUserObj.username}`;
    }

    // Save in DB
    const broadcastRecord = await Broadcast.create({
      sender: req.user._id,
      audience: finalAudience,
      targetUser: audience === 'Specific User' ? targetUserId : null,
      message: message.trim(),
      isPermanent: !!isPermanent,
      expiresAt
    });

    // Retrieve target recipients based on audience
    let recipients = [];
    try {
      if (audience === 'Specific User') {
        if (targetUserObj) recipients = [targetUserObj];
      } else {
        let userQuery = {};
        if (audience === 'Moderators Only' || audience === 'Moderators') {
          userQuery = { role: { $in: ['moderator', 'admin'] } };
        } else if (audience === 'Active Users (Last 24h)') {
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          userQuery = { updatedAt: { $gte: oneDayAgo } };
        }
        recipients = await User.find(userQuery).select('_id');
      }
    } catch (dbErr) {
      console.error("Failed to retrieve broadcast recipients:", dbErr);
    }

    // Emit broadcast notification via socket to target audience only
    if (req.io && recipients.length > 0) {
      const notifsToInsert = recipients.map(r => ({
        userId: r._id,
        type: 'system',
        title: `Announcement (${audience || 'All Users'})`,
        body: message.trim(),
        isPermanent: !!isPermanent,
        expiresAt,
        metadata: { broadcastId: broadcastRecord._id }
      }));
      
      try {
        const insertedNotifs = await Notification.insertMany(notifsToInsert);
        const notifMap = {};
        insertedNotifs.forEach(n => notifMap[n.userId.toString()] = n._id);

        recipients.forEach((recipient) => {
          req.io.to(recipient._id.toString()).emit('broadcastNotification', {
            id: notifMap[recipient._id.toString()], // Use the new Notification ID
            message: message.trim(),
            audience: audience || 'All Users',
            sender: req.user.displayName || req.user.username,
            createdAt: broadcastRecord.createdAt,
            isPermanent: broadcastRecord.isPermanent,
            expiresAt: broadcastRecord.expiresAt
          });
        });
      } catch (err) {
        console.error("Failed to insert broadcast notifications:", err);
      }
    }

    // Trigger push notifications for the broadcast in the background
    if (recipients.length > 0) {
      try {
        recipients.forEach(async (u) => {
          // Don't send push to the sending admin themselves
          if (u._id.toString() !== req.user._id.toString()) {
            await sendPushNotification(u._id.toString(), {
              title: `📣 Announcement (${audience || 'All Users'})`,
              body: message.trim(),
              icon: '/logo.png'
            });
          }
        });
      } catch (pushErr) {
        console.error("Failed to dispatch broadcast push notifications:", pushErr);
      }
    }

    // Log admin audit
    await AuditLog.create({
      adminId: req.user._id,
      action: 'SEND_BROADCAST',
      targetId: broadcastRecord._id,
      targetModel: 'User',
      details: `Admin sent broadcast to [${audience || 'All Users'}]: "${message.substring(0, 60)}"`
    });

    res.status(200).json({ message: "Broadcast sent successfully to all active client sockets", broadcast: broadcastRecord });
  } catch (error) {
    console.error("Error in sendBroadcast:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getBroadcasts = async (req, res) => {
  try {
    const broadcasts = await Broadcast.find()
      .populate('sender', 'displayName username profilePic')
      .sort({ createdAt: -1 });
    res.status(200).json(broadcasts);
  } catch (error) {
    console.error("Error in getBroadcasts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteBroadcast = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Broadcast.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Broadcast not found" });
    }

    // Log admin audit
    await AuditLog.create({
      adminId: req.user._id,
      action: 'DELETE_BROADCAST',
      targetId: id,
      targetModel: 'User',
      details: `Admin deleted broadcast: "${deleted.message.substring(0, 60)}"`
    });

    // Emit broadcast deleted via socket
    if (req.io) {
      req.io.emit('broadcastDeleted', { id });
    }

    res.status(200).json({ message: "Broadcast deleted successfully" });
  } catch (error) {
    console.error("Error in deleteBroadcast:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getDatabaseUsageStats = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ message: "Database connection not established" });
    }

    const stats = await db.command({ dbStats: 1 });
    const collectionsCursor = await db.listCollections().toArray();
    
    const collectionStats = await Promise.all(collectionsCursor.map(async (coll) => {
      try {
        const collStats = await db.command({ collStats: coll.name });
        return {
          name: coll.name,
          count: collStats.count,
          size: collStats.size,
          avgObjSize: collStats.avgObjSize || 0,
          nindexes: collStats.nindexes,
          totalIndexSize: collStats.totalIndexSize
        };
      } catch (err) {
        return null;
      }
    }));

    const validCollectionStats = collectionStats.filter(c => c !== null);

    const systemHealth = {
      mongodb: mongoose.connection.readyState === 1 ? 'healthy' : 'error',
      socketio: req.io ? 'healthy' : 'warning',
      cloudinary: process.env.CLOUDINARY_API_KEY ? 'healthy' : 'warning',
      api: 'healthy',
      activeConnections: req.io ? req.io.engine.clientsCount : 0
    };

    res.status(200).json({
      database: {
        dbName: stats.db,
        collections: stats.collections,
        objects: stats.objects,
        avgObjSize: stats.avgObjSize,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        indexSize: stats.indexSize,
        fsUsedSize: stats.fsUsedSize,
        fsTotalSize: stats.fsTotalSize,
      },
      collections: validCollectionStats,
      systemHealth,
      uptime: process.uptime()
    });
  } catch (error) {
    console.error("Error in getDatabaseUsageStats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserConversationsByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const chats = await Chat.find({ participants: userId })
      .populate('participants', 'username displayName profilePic')
      .sort({ updatedAt: -1 });
    res.status(200).json(chats);
  } catch (error) {
    console.error("Error in getUserConversationsByAdmin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getConversationMessagesByAdmin = async (req, res) => {
  try {
    const { chatId } = req.params;
    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'username displayName profilePic')
      .sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getConversationMessagesByAdmin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const bulkDeleteMessagesByAdmin = async (req, res) => {
  try {
    const { messageIds } = req.body;
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ message: "Please provide an array of message IDs" });
    }

    // Identify chats affected before deleting to emit socket events
    const messages = await Message.find({ _id: { $in: messageIds } });
    if (messages.length === 0) {
      return res.status(404).json({ message: "Messages not found" });
    }

    // We can emit to chats so participants know messages are deleted
    const chatsAffected = new Set();
    messages.forEach(msg => chatsAffected.add(msg.chat.toString()));

    await Message.deleteMany({ _id: { $in: messageIds } });

    // Log the bulk deletion
    await AuditLog.create({
      adminId: req.user._id,
      action: 'MODERATION_DELETE_MESSAGE',
      targetId: messageIds[0], // record at least the first
      targetModel: 'Message',
      details: `Administratively bulk-deleted ${messageIds.length} messages.`
    });

    if (req.io) {
      chatsAffected.forEach(chatId => {
        messageIds.forEach(msgId => {
          req.io.to(chatId).emit('messageDeleted', { messageId: msgId, chatId });
        });
      });
    }

    res.status(200).json({ message: `Successfully deleted ${messageIds.length} messages` });
  } catch (error) {
    console.error("Error in bulkDeleteMessagesByAdmin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUsernameRequests = async (req, res) => {
  try {
    const requests = await UsernameChangeRequest.find()
      .populate('userId', 'username displayName profilePic email')
      .sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    console.error("Error in getUsernameRequests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUsernameRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, grantedChanges } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Status must be approved or rejected" });
    }

    const request = await UsernameChangeRequest.findById(id).populate('userId');
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.status !== 'pending') {
      return res.status(400).json({ message: "Request has already been processed" });
    }

    request.status = status;
    request.approvedBy = req.user.displayName;
    
    let additional = 0;
    if (status === 'approved') {
      additional = parseInt(grantedChanges);
      if (isNaN(additional) || additional < 1) {
        return res.status(400).json({ message: "Must provide a valid number of granted changes" });
      }
      request.grantedChanges = additional;
    }
    
    if (adminNotes) request.adminNotes = adminNotes;
    await request.save();

    if (status === 'approved') {
      await User.findByIdAndUpdate(request.userId._id, {
        $inc: { maxUsernameChanges: additional }
      });
    }

    // Log admin audit
    await AuditLog.create({
      adminId: req.user._id,
      action: status === 'approved' ? 'APPROVE_USERNAME_REQUEST' : 'REJECT_USERNAME_REQUEST',
      targetId: request._id,
      targetModel: 'UsernameChangeRequest',
      details: `Admin ${status} username request for ${request.requestedUsername}. Notes: ${adminNotes || 'None'}`
    });

    // Notify user via socket
    if (req.io) {
      req.io.to(request.userId._id.toString()).emit('adminNotification', {
        type: 'username_request',
        title: 'Username Request Update',
        message: `Your request to change username to ${request.requestedUsername} was ${status}. ${adminNotes ? 'Admin Note: ' + adminNotes : ''}`
      });
      req.io.to(request.userId._id.toString()).emit('usernameLimitsUpdated');
    }

    res.status(200).json({ message: `Request marked as ${status}`, request });
  } catch (error) {
    console.error("Error in updateUsernameRequest:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateAdminUsername = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || username.length < 8) {
      return res.status(400).json({ message: "Username must be at least 8 characters long." });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
      return res.status(400).json({ message: "Username is already taken." });
    }

    const admin = await User.findById(req.user._id);
    const oldUsername = admin.username;
    
    admin.username = username;
    await admin.save();

    await AuditLog.create({
      adminId: req.user._id,
      action: 'UPDATE_ADMIN_CREDENTIALS',
      targetId: req.user._id,
      targetModel: 'User',
      details: `Admin changed their username from ${oldUsername} to ${username}.`
    });

    res.status(200).json({ message: "Username updated successfully", username: admin.username });
  } catch (error) {
    console.error("Error in updateAdminUsername:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Invalid password data provided." });
    }

    const admin = await User.findById(req.user._id);
    
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    await admin.save();

    await AuditLog.create({
      adminId: req.user._id,
      action: 'UPDATE_ADMIN_CREDENTIALS',
      targetId: req.user._id,
      targetModel: 'User',
      details: `Admin changed their password.`
    });

    // Force logout across all active sessions via socket
    if (req.io) {
      req.io.to(req.user._id.toString()).emit('forceLogout');
    }

    // Clear current session cookie
    res.cookie("jwt", "", { maxAge: 0 });

    res.status(200).json({ message: "Password updated successfully. Please log in again." });
  } catch (error) {
    console.error("Error in updateAdminPassword:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

