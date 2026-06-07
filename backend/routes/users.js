import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { getUsersForSidebar, updateProfile, changeUsername, getUserById, getActiveBroadcasts, updatePrivacySettings } from '../controllers/user.controller.js';
import { getSettings } from '../controllers/admin.controller.js';
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

router.get('/settings', protectRoute, getSettings);
router.get('/', protectRoute, getUsersForSidebar);
router.put('/profile', protectRoute, updateProfile);
router.put('/update-profile', protectRoute, updateProfile);
router.put('/change-username', protectRoute, changeUsername);
router.put('/privacy', protectRoute, updatePrivacySettings);
router.get('/notifications/broadcasts', protectRoute, getActiveBroadcasts);
// Friend System Routes
router.get('/search', protectRoute, searchUsers);
router.get('/friends', protectRoute, getFriends);
router.get('/requests', protectRoute, getPendingRequests);
router.post('/request/:userId', protectRoute, sendFriendRequest);
router.post('/accept/:userId', protectRoute, acceptFriendRequest);
router.post('/reject/:userId', protectRoute, rejectFriendRequest);
router.delete('/remove/:userId', protectRoute, removeFriend);
router.post('/block/:userId', protectRoute, blockUser);

// Web Push Notification Routing
import { getPublicKey } from '../utils/webPush.js';
import PushSubscription from '../models/PushSubscription.js';

router.get('/push/vapid-key', protectRoute, (req, res) => {
  res.json({ publicKey: getPublicKey() });
});

router.post('/push/subscribe', protectRoute, async (req, res) => {
  const { subscription } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ message: "Subscription payload required" });
  }

  try {
    await PushSubscription.findOneAndUpdate(
      { 'subscription.endpoint': subscription.endpoint },
      { userId: req.user._id, subscription },
      { upsert: true, new: true }
    );
    res.status(201).json({ message: "Subscribed successfully for background notifications" });
  } catch (error) {
    console.error("Error subscribing to push notifications:", error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/push/unsubscribe', protectRoute, async (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) {
    return res.status(400).json({ message: "Endpoint required" });
  }

  try {
    await PushSubscription.deleteOne({ 'subscription.endpoint': endpoint });
    res.json({ message: "Unsubscribed successfully from background notifications" });
  } catch (error) {
    console.error("Error unsubscribing from push notifications:", error);
  }
});

// Retrieve user by ID (defined at the very end to avoid shadowing static routes)
router.get('/:id', protectRoute, getUserById);

export default router;
