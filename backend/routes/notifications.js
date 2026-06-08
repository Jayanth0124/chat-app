import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification, 
  clearAll 
} from '../controllers/notification.controller.js';

const router = express.Router();

router.get('/', protectRoute, getNotifications);
router.put('/read-all', protectRoute, markAllAsRead);
router.put('/:id/read', protectRoute, markAsRead);
router.delete('/all', protectRoute, clearAll);
router.delete('/:id', protectRoute, deleteNotification);

export default router;
