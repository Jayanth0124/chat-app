import express from 'express';
import { protectRoute, requireAdmin } from '../middleware/auth.middleware.js';
import SupportTicket from '../models/SupportTicket.js';
import BugReport from '../models/BugReport.js';
import Notification from '../models/Notification.js';
import cloudinary from '../utils/cloudinary.js';

const router = express.Router();

// --- USER ROUTES ---

// Submit a support ticket
router.post('/tickets', protectRoute, async (req, res) => {
  try {
    const { subject, category, description } = req.body;
    if (!subject || !category || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const ticket = new SupportTicket({
      user: req.user._id,
      subject,
      category,
      description
    });

    await ticket.save();

    // Populate user info for socket payload
    const populatedTicket = await SupportTicket.findById(ticket._id).populate('user', 'displayName username profilePic');

    // Socket alert to admins
    if (req.io) {
      // NOTE: For 'admins' we don't have a specific userId to save to DB easily here without fetching all admins.
      // Since it's a broadcast to 'admins' room, we can just emit it or save it if we query admins.
      // Orbit adminNotification isn't strictly personal, so we'll just emit.
      req.io.to('admins').emit('adminNotification', {
        type: 'new_ticket',
        title: 'New Support Ticket',
        message: `[${category}] "${subject}" submitted by ${req.user.displayName || req.user.username}`
      });
    }

    res.status(201).json(populatedTicket);
  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get logged-in user's tickets
router.get('/tickets', protectRoute, async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id })
      .populate('user', 'displayName username profilePic')
      .populate('replies.sender', 'displayName username profilePic role')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    console.error("Error fetching user tickets:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Submit a bug report
router.post('/bugs', protectRoute, async (req, res) => {
  try {
    const { title, stepsToReproduce, expectedBehavior, actualBehavior, screenshot, additionalNotes } = req.body;
    if (!title || !stepsToReproduce || !expectedBehavior || !actualBehavior) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    let screenshotUrl = "";
    if (screenshot) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(screenshot, {
          folder: "orbit/bugs"
        });
        screenshotUrl = uploadResponse.secure_url;
      } catch (err) {
        console.error("Cloudinary upload failed for bug report:", err);
      }
    }

    const bug = new BugReport({
      user: req.user._id,
      title,
      stepsToReproduce,
      expectedBehavior,
      actualBehavior,
      screenshot: screenshotUrl,
      additionalNotes
    });

    await bug.save();

    // Populate user info for socket payload
    const populatedBug = await BugReport.findById(bug._id).populate('user', 'displayName username profilePic');

    // Socket alert to admins
    if (req.io) {
      req.io.to('admins').emit('adminNotification', {
        type: 'new_bug',
        title: 'New Bug Report',
        message: `"${title}" submitted by ${req.user.displayName || req.user.username}`
      });
    }

    res.status(201).json(populatedBug);
  } catch (error) {
    console.error("Error creating bug report:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get logged-in user's bug reports
router.get('/bugs', protectRoute, async (req, res) => {
  try {
    const bugs = await BugReport.find({ user: req.user._id })
      .populate('user', 'displayName username profilePic')
      .sort({ createdAt: -1 });
    res.json(bugs);
  } catch (error) {
    console.error("Error fetching user bugs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// --- ADMIN ROUTES ---

// Fetch support statistics
router.get('/admin/stats', protectRoute, requireAdmin, async (req, res) => {
  try {
    const openTickets = await SupportTicket.countDocuments({ status: 'Open' });
    const inProgressTickets = await SupportTicket.countDocuments({ status: 'In Progress' });
    const resolvedTickets = await SupportTicket.countDocuments({ status: 'Resolved' });
    const openBugs = await BugReport.countDocuments({ status: { $in: ['Open', 'Investigating'] } });

    res.json({
      openTickets,
      inProgressTickets,
      resolvedTickets,
      openBugs
    });
  } catch (error) {
    console.error("Error fetching admin support stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Fetch all support tickets
router.get('/admin/tickets', protectRoute, requireAdmin, async (req, res) => {
  try {
    const tickets = await SupportTicket.find()
      .populate('user', 'displayName username email profilePic')
      .populate('replies.sender', 'displayName username profilePic role')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    console.error("Error fetching all tickets:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Fetch all bug reports
router.get('/admin/bugs', protectRoute, requireAdmin, async (req, res) => {
  try {
    const bugs = await BugReport.find()
      .populate('user', 'displayName username email profilePic')
      .populate('replies.sender', 'displayName username profilePic role')
      .sort({ createdAt: -1 });
    res.json(bugs);
  } catch (error) {
    console.error("Error fetching all bug reports:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update support ticket status
router.put('/admin/tickets/:id', protectRoute, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Open', 'In Progress', 'Waiting For User', 'Resolved', 'Closed'].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('user', 'displayName username email profilePic')
      .populate('replies.sender', 'displayName username profilePic role');

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Notify user via Socket
    if (req.io && ticket.user) {
      const msg = `Your support ticket (#${ticket.ticketId}) status has been updated to "${status}".`;
      const newNotif = await Notification.create({
        userId: ticket.user._id,
        type: 'support_reply',
        title: 'Status Updated',
        body: msg,
        metadata: { ticketId: ticket._id }
      });

      req.io.to(ticket.user._id.toString()).emit('ticketUpdated', {
        id: newNotif._id,
        ticket,
        actionType: 'Status Updated',
        message: msg
      });
    }

    res.json(ticket);
  } catch (error) {
    console.error("Error updating ticket:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Reply to support ticket
router.post('/admin/tickets/:id/reply', protectRoute, requireAdmin, async (req, res) => {
  try {
    const { response, status } = req.body;
    if (!response || !response.trim()) {
      return res.status(400).json({ message: "Reply content is required" });
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Append reply
    ticket.replies.push({
      sender: req.user._id,
      response: response.trim(),
      createdAt: new Date()
    });

    // Optionally update status
    if (status && ['Open', 'In Progress', 'Waiting For User', 'Resolved', 'Closed'].includes(status)) {
      ticket.status = status;
    }

    await ticket.save();

    // Populate full ticket
    const updatedTicket = await SupportTicket.findById(ticket._id)
      .populate('user', 'displayName username email profilePic')
      .populate('replies.sender', 'displayName username profilePic role');

    // Notify user via Socket
    if (req.io && updatedTicket.user) {
      const msg = `Support team replied: "${response.substring(0, 45)}${response.length > 45 ? '...' : ''}"`;
      const newNotif = await Notification.create({
        userId: updatedTicket.user._id,
        type: 'support_reply',
        title: 'Ticket Replied',
        body: msg,
        metadata: { ticketId: updatedTicket._id }
      });

      req.io.to(updatedTicket.user._id.toString()).emit('ticketUpdated', {
        id: newNotif._id,
        ticket: updatedTicket,
        actionType: 'Replied',
        message: msg
      });
    }

    res.json(updatedTicket);
  } catch (error) {
    console.error("Error replying to ticket:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update bug report (status & adminNotes)
router.put('/admin/bugs/:id', protectRoute, requireAdmin, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    
    const updateData = {};
    if (status) {
      if (!['Open', 'Investigating', 'Fixed', 'Duplicate', 'Resolved', 'Closed'].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      updateData.status = status;
    }
    if (typeof adminNotes === 'string') {
      updateData.adminNotes = adminNotes;
    }

    const bug = await BugReport.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('user', 'displayName username email profilePic');

    if (!bug) {
      return res.status(404).json({ message: "Bug report not found" });
    }

    // Notify user via Socket if status changed
    if (status && req.io && bug.user) {
      const msg = `Your bug report (#${bug.reportId}) status has been updated to "${status}".`;
      const newNotif = await Notification.create({
        userId: bug.user._id,
        type: 'bug_update',
        title: 'Status Updated',
        body: msg,
        metadata: { bugId: bug._id }
      });

      req.io.to(bug.user._id.toString()).emit('bugUpdated', {
        id: newNotif._id,
        bug,
        actionType: 'Status Updated',
        message: msg
      });
    }

    res.json(bug);
  } catch (error) {
    console.error("Error updating bug report:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Reply to bug report
router.post('/admin/bugs/:id/reply', protectRoute, requireAdmin, async (req, res) => {
  try {
    const { response, status } = req.body;
    if (!response || !response.trim()) {
      return res.status(400).json({ message: "Reply content is required" });
    }

    const bug = await BugReport.findById(req.params.id);
    if (!bug) {
      return res.status(404).json({ message: "Bug report not found" });
    }

    // Append reply
    bug.replies.push({
      sender: req.user._id,
      response: response.trim(),
      createdAt: new Date()
    });

    // Optionally update status
    if (status && ['Open', 'Investigating', 'Fixed', 'Duplicate', 'Resolved', 'Closed'].includes(status)) {
      bug.status = status;
    }

    await bug.save();

    // Populate full bug report
    const updatedBug = await BugReport.findById(bug._id)
      .populate('user', 'displayName username email profilePic')
      .populate('replies.sender', 'displayName username profilePic role');

    // Notify user via Socket
    if (req.io && updatedBug.user) {
      const msg = `Admin replied to your bug report: "${response.substring(0, 45)}${response.length > 45 ? '...' : ''}"`;
      const newNotif = await Notification.create({
        userId: updatedBug.user._id,
        type: 'bug_update',
        title: 'Bug Report Replied',
        body: msg,
        metadata: { bugId: updatedBug._id }
      });

      req.io.to(updatedBug.user._id.toString()).emit('bugUpdated', {
        id: newNotif._id,
        bug: updatedBug,
        actionType: 'Replied',
        message: msg
      });
    }

    res.json(updatedBug);
  } catch (error) {
    console.error("Error replying to bug report:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
