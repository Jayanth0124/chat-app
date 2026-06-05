import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { 
  accessChat, 
  fetchChats, 
  sendMessage, 
  fetchMessages, 
  viewOnceMessage,
  markChatAsSeen,
  updateVanishMode,
  deleteChat
} from '../controllers/chat.controller.js';

const router = express.Router();

router.post('/', protectRoute, accessChat);
router.get('/', protectRoute, fetchChats);
router.post('/message', protectRoute, sendMessage);
router.get('/:chatId', protectRoute, fetchMessages);
router.post('/message/:messageId/view', protectRoute, viewOnceMessage);
router.post('/:chatId/seen', protectRoute, markChatAsSeen);
router.put('/:chatId/vanish', protectRoute, updateVanishMode);
router.delete('/:chatId', protectRoute, deleteChat);

export default router;
