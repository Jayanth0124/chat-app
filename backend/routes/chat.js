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
  deleteChat,
  reportMessage,
  deleteMessage,
  markChatAsUnread
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
router.post('/message/:messageId/report', protectRoute, reportMessage);
router.delete('/message/:messageId', protectRoute, deleteMessage);
router.post('/:chatId/unread', protectRoute, markChatAsUnread);

export default router;
