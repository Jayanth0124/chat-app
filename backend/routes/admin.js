import express from 'express';
import { protectRoute, requireAdmin } from '../middleware/auth.middleware.js';
import { getDashboardStats, getAllUsers, banUser, getAuditLogs } from '../controllers/admin.controller.js';

const router = express.Router();

// All admin routes must pass both protectRoute and requireAdmin
router.use(protectRoute, requireAdmin);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:userId/ban', banUser);
router.get('/audit-logs', getAuditLogs);

export default router;
