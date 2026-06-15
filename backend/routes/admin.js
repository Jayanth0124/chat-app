import express from 'express';
import { protectRoute, requireAdmin } from '../middleware/auth.middleware.js';
import { 
  getDashboardStats, 
  getAllUsers, 
  banUser, 
  warnUser,
  forceLogoutUser,
  suspendUser,
  restrictCommsUser,
  clearUserStories,
  deleteUser,
  getAuditLogs,
  getReports,
  updateReportStatus,
  deleteMessageByAdmin,
  bulkDeleteMessagesByAdmin,
  getSecurityLogs,
  blockIP,
  sendBroadcast,
  getBroadcasts,
  deleteBroadcast,
  getSettings,
  updateSetting,
  getDatabaseUsageStats,
  getUserConversationsByAdmin,
  getConversationMessagesByAdmin,
  getUsernameRequests,
  updateUsernameRequest,
  updateAdminUsername,
  updateAdminPassword
} from '../controllers/admin.controller.js';

const router = express.Router();

// All admin routes must pass both protectRoute and requireAdmin
router.use(protectRoute, requireAdmin);

router.get('/stats', getDashboardStats);
router.get('/database-stats', getDatabaseUsageStats);
router.get('/users', getAllUsers);
router.put('/users/:userId/ban', banUser);
router.post('/users/:userId/warn', warnUser);
router.post('/users/:userId/logout', forceLogoutUser);
router.put('/users/:userId/suspend', suspendUser);
router.put('/users/:userId/restrict', restrictCommsUser);
router.delete('/users/:userId/stories', clearUserStories);
router.delete('/users/:userId', deleteUser);
router.get('/audit-logs', getAuditLogs);
router.get('/reports', getReports);
router.put('/reports/:reportId/status', updateReportStatus);
router.get('/users/:userId/conversations', getUserConversationsByAdmin);
router.get('/conversations/:chatId/messages', getConversationMessagesByAdmin);
router.delete('/messages/:messageId', deleteMessageByAdmin);
router.post('/messages/bulk-delete', bulkDeleteMessagesByAdmin);
router.get('/security-logs', getSecurityLogs);
router.post('/security/block-ip', blockIP);
router.post('/notifications/broadcast', sendBroadcast);
router.get('/notifications/broadcast', getBroadcasts);
router.delete('/notifications/broadcast/:id', deleteBroadcast);
router.get('/settings', getSettings);
router.post('/settings', updateSetting);

router.get('/username-requests', getUsernameRequests);
router.put('/username-requests/:id', updateUsernameRequest);

router.put('/credentials/username', updateAdminUsername);
router.put('/credentials/password', updateAdminPassword);

export default router;
