import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import AuditLog from '../models/AuditLog.js';
import Report from '../models/Report.js';
import SecurityLog from '../models/SecurityLog.js';
import Broadcast from '../models/Broadcast.js';
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

    // Count friend requests
    const friendRequestsRes = await User.aggregate([
      { $project: { count: { $size: { $ifNull: ["$friendRequests", []] } } } },
      { $group: { _id: null, total: { $sum: "$count" } } }
    ]);
    const friendRequests = friendRequestsRes[0]?.total || 0;

    res.status(200).json({
      totalUsers,
      activeUsers,
      onlineUsers,
      messagesSent,
      friendRequests,
      reportsSubmitted,
      bannedUsers,
      totalChats
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

export const sendBroadcast = async (req, res) => {
  try {
    const { audience, message, isPermanent } = req.body;
    if (!message) {
      return res.status(400).json({ message: "Message content is required" });
    }

    const expiresAt = isPermanent 
      ? null 
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Save in DB
    const broadcastRecord = await Broadcast.create({
      sender: req.user._id,
      audience: audience || 'All Users',
      message: message.trim(),
      isPermanent: !!isPermanent,
      expiresAt
    });

    // Retrieve target recipients based on audience
    let recipients = [];
    try {
      let userQuery = {};
      if (audience === 'Moderators Only' || audience === 'Moderators') {
        userQuery = { role: { $in: ['moderator', 'admin'] } };
      } else if (audience === 'Active Users (Last 24h)') {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        userQuery = { updatedAt: { $gte: oneDayAgo } };
      }
      recipients = await User.find(userQuery).select('_id');
    } catch (dbErr) {
      console.error("Failed to retrieve broadcast recipients:", dbErr);
    }

    // Emit broadcast notification via socket to target audience only
    if (req.io && recipients.length > 0) {
      recipients.forEach((recipient) => {
        req.io.to(recipient._id.toString()).emit('broadcastNotification', {
          id: broadcastRecord._id,
          message: message.trim(),
          audience: audience || 'All Users',
          sender: req.user.displayName || req.user.username,
          createdAt: broadcastRecord.createdAt,
          isPermanent: broadcastRecord.isPermanent,
          expiresAt: broadcastRecord.expiresAt
        });
      });
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
