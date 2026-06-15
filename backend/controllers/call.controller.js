import Call from '../models/Call.js';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { sendPushNotification } from '../utils/webPush.js';
import Connection from '../models/Connection.js';

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
      status: 'ringing' // Defaulting to ringing now
    });
    
    await User.findByIdAndUpdate(callerId, { $inc: { "lifetimeMetrics.callsMade": 1 } });
    await User.findByIdAndUpdate(receiverId, { $inc: { "lifetimeMetrics.callsMade": 1 } });

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

    // Guaranteed Socket Signaling (overrides frontend failure)
    if (req.io) {
      req.io.to(receiverId.toString()).emit('call:incoming', {
        callId: call._id,
        callerId: call.caller._id,
        callerName: call.caller.displayName,
        callerPic: call.caller.profilePic,
        type: call.type
      });
    }

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

    if (['completed', 'missed', 'rejected', 'declined'].includes(status)) {
      const callerId = call.caller._id;
      const receiverId = call.receiver._id;

      if (status === 'completed' && duration) {
        const scoreIncrement = Math.floor(duration / 10);
        const isVideo = call.type === 'video';

        const sortedUsers = [callerId.toString(), receiverId.toString()].sort();

        await Connection.findOneAndUpdate(
          { users: sortedUsers },
          {
            $inc: {
              totalScore: scoreIncrement,
              ...(isVideo ? { videoCallDuration: duration } : { voiceCallDuration: duration })
            }
          },
          { upsert: true, new: true }
        );
      }

      // Create a Call Log Message in their Chat
      let chat = await Chat.findOne({
        isGroupChat: false,
        $and: [
          { participants: { $elemMatch: { $eq: callerId } } },
          { participants: { $elemMatch: { $eq: receiverId } } },
        ]
      });

      if (chat) {
        let callLogMsg = await Message.create({
          sender: callerId,
          content: '',
          chat: chat._id,
          messageType: 'call',
          callData: {
            callType: call.type, // 'voice' or 'video'
            status: status, // 'completed', 'missed', 'rejected'
            duration: duration || 0
          }
        });

        callLogMsg = await callLogMsg.populate("sender", "displayName profilePic");
        callLogMsg = await callLogMsg.populate("chat");
        callLogMsg = await User.populate(callLogMsg, {
          path: "chat.participants",
          select: "displayName profilePic email",
        });

        await Chat.findByIdAndUpdate(chat._id, { latestMessage: callLogMsg });

        if (req.io && callLogMsg.chat.participants) {
          callLogMsg.chat.participants.forEach((participant) => {
            req.io.to(participant._id.toString()).emit("message received", callLogMsg);
          });
        }
      }
    }

    res.status(200).json(call);
  } catch (error) {
    console.error('Error in updateCall:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/calls/:callId — fetch a specific call's real-time status
export const getCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const call = await Call.findById(callId)
      .populate('caller', 'displayName profilePic username')
      .populate('receiver', 'displayName profilePic username');

    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    // Verify user is authorized to view this call
    if (call.caller._id.toString() !== req.user._id.toString() && call.receiver._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.status(200).json(call);
  } catch (error) {
    console.error('Error in getCall:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
