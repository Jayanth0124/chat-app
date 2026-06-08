import Call from '../models/Call.js';
import User from '../models/User.js';
import { sendPushNotification } from '../utils/webPush.js';

// GET /api/calls — fetch call history for the logged-in user
export const getCallHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const calls = await Call.find({
      $or: [{ caller: userId }, { receiver: userId }]
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('caller', 'displayName profilePic username')
      .populate('receiver', 'displayName profilePic username');

    res.status(200).json(calls);
  } catch (error) {
    console.error('Error in getCallHistory:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/calls — create a call record (called when a call is initiated)
export const createCall = async (req, res) => {
  try {
    const { receiverId, type } = req.body;
    const callerId = req.user._id;

    if (!receiverId || !type) {
      return res.status(400).json({ error: 'receiverId and type are required' });
    }

    const caller = await User.findById(callerId);
    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    if (receiver.status === 'banned') {
      return res.status(403).json({ error: 'Cannot call banned users.' });
    }

    const isBlocked = caller.blockedUsers.map(id => id.toString()).includes(receiverId.toString()) ||
                      receiver.blockedUsers.map(id => id.toString()).includes(callerId.toString());
    if (isBlocked) {
      return res.status(403).json({ error: 'Cannot call blocked users.' });
    }

    const areFriends = caller.friends.map(id => id.toString()).includes(receiverId.toString()) &&
                       receiver.friends.map(id => id.toString()).includes(callerId.toString());
    if (!areFriends) {
      return res.status(403).json({ error: 'You can only call accepted friends.' });
    }

    const call = await Call.create({
      caller: callerId,
      receiver: receiverId,
      type,
      status: 'missed' // default; will be updated when call ends
    });

    await call.populate('caller', 'displayName profilePic username');
    await call.populate('receiver', 'displayName profilePic username');

    // Send Web Push Notification to Receiver
    const payload = {
      type: 'incoming_call',
      title: 'Incoming Voice Call',
      body: `${call.caller.displayName} is calling you.`,
      icon: call.caller.profilePic || '/logo.png',
      data: {
        type: 'incoming_call',
        callId: call._id,
        callerId: call.caller._id,
        callType: call.type,
        callerName: call.caller.displayName,
        callerPic: call.caller.profilePic
      }
    };
    await sendPushNotification(receiverId, payload);

    res.status(201).json(call);
  } catch (error) {
    console.error('Error in createCall:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PATCH /api/calls/:callId — update a call status/duration when it ends
export const updateCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const { status, duration } = req.body;

    const call = await Call.findByIdAndUpdate(
      callId,
      { status, duration },
      { new: true }
    )
      .populate('caller', 'displayName profilePic username')
      .populate('receiver', 'displayName profilePic username');

    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    res.status(200).json(call);
  } catch (error) {
    console.error('Error in updateCall:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
