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
  markChatAsUnread,
  pinChat,
  muteChat,
  unsendMessage,
  deleteMessagesForMe
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
router.post('/:chatId/pin', protectRoute, pinChat);
router.post('/:chatId/mute', protectRoute, muteChat);
router.post('/messages/unsend', protectRoute, unsendMessage);
router.post('/messages/delete', protectRoute, deleteMessagesForMe);

export default router;
