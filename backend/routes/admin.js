import express from 'express';
import { protectRoute, requireAdmin } from '../middleware/auth.middleware.js';
import { 
  getDashboardStats, 
  getAllUsers, 
  banUser, 
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
  updateUsernameRequest
} from '../controllers/admin.controller.js';

const router = express.Router();

// All admin routes must pass both protectRoute and requireAdmin
router.use(protectRoute, requireAdmin);

router.get('/stats', getDashboardStats);
router.get('/database-stats', getDatabaseUsageStats);
router.get('/users', getAllUsers);
router.put('/users/:userId/ban', banUser);
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

export default router;
