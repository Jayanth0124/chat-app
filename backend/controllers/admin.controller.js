import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import AuditLog from '../models/AuditLog.js';

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const bannedUsers = await User.countDocuments({ status: 'banned' });
    const totalChats = await Chat.countDocuments();
    const totalMessages = await Message.countDocuments();

    res.status(200).json({
      totalUsers,
      activeUsers,
      bannedUsers,
      totalChats,
      totalMessages
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
