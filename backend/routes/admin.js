import express from 'express';
import { protectRoute, requireAdmin } from '../middleware/auth.middleware.js';
import { 
  getDashboardStats, 
  getAllUsers, 
  banUser, 
  getAuditLogs,
  getReports,
  updateReportStatus,
  deleteMessageByAdmin,
  getSecurityLogs,
  blockIP,
  sendBroadcast
} from '../controllers/admin.controller.js';

const router = express.Router();

// All admin routes must pass both protectRoute and requireAdmin
router.use(protectRoute, requireAdmin);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:userId/ban', banUser);
router.get('/audit-logs', getAuditLogs);
router.get('/reports', getReports);
router.put('/reports/:reportId/status', updateReportStatus);
router.delete('/messages/:messageId', deleteMessageByAdmin);
router.get('/security-logs', getSecurityLogs);
router.post('/security/block-ip', blockIP);
router.post('/notifications/broadcast', sendBroadcast);

export default router;
