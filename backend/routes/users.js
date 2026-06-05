import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { getUsersForSidebar, updateProfile, changeUsername } from '../controllers/user.controller.js';
import { 
  searchUsers, 
  sendFriendRequest, 
  acceptFriendRequest, 
  rejectFriendRequest, 
  getFriends, 
  getPendingRequests,
  removeFriend,
  blockUser
} from '../controllers/friends.controller.js';

const router = express.Router();

router.get('/', protectRoute, getUsersForSidebar);
router.put('/profile', protectRoute, updateProfile);
router.put('/update-profile', protectRoute, updateProfile);
router.put('/change-username', protectRoute, changeUsername);

// Friend System Routes
router.get('/search', protectRoute, searchUsers);
router.get('/friends', protectRoute, getFriends);
router.get('/requests', protectRoute, getPendingRequests);
router.post('/request/:userId', protectRoute, sendFriendRequest);
router.post('/accept/:userId', protectRoute, acceptFriendRequest);
router.post('/reject/:userId', protectRoute, rejectFriendRequest);
router.delete('/remove/:userId', protectRoute, removeFriend);
router.post('/block/:userId', protectRoute, blockUser);

export default router;
