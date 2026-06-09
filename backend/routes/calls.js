import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { getCallHistory, createCall, updateCall, getCall } from '../controllers/call.controller.js';

const router = express.Router();

router.get('/', protectRoute, getCallHistory);
router.post('/', protectRoute, createCall);
router.patch('/:callId', protectRoute, updateCall);
router.get('/:callId', protectRoute, getCall);

export default router;
