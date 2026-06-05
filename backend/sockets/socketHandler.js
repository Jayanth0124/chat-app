import User from '../models/User.js';
import Message from '../models/Message.js';
import Call from '../models/Call.js';

export const handleSockets = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // ─── SETUP ───────────────────────────────────────────────
    socket.on('setup', async (userData) => {
      if (!userData || !userData._id) return;
      socket.join(userData._id);
      socket.userId = userData._id;
      socket.emit('connected');

      try {
        await User.findByIdAndUpdate(userData._id, { isOnline: true });

        // Notify all friends this user is now online
        const user = await User.findById(userData._id).populate('friends', '_id');
        if (user?.friends) {
          user.friends.forEach((friend) => {
            io.to(friend._id.toString()).emit('friendStatusUpdate', {
              userId: userData._id,
              isOnline: true,
              lastSeen: new Date()
            });
          });
        }

        // Mark undelivered messages for this user as 'delivered'
        const updatedMessages = await Message.updateMany(
          {
            status: 'sent',
            'chat': { $exists: true },
            sender: { $ne: userData._id }
          },
          { $set: { status: 'delivered' } }
        );

      } catch (error) {
        console.error('Error in setup socket handler:', error);
      }
    });

    // ─── CHAT ROOM ───────────────────────────────────────────
    socket.on('join chat', (room) => {
      socket.join(room);
    });

    socket.on('leave chat', (room) => {
      socket.leave(room);
    });

    // ─── TYPING ──────────────────────────────────────────────
    socket.on('typing', (room) => socket.in(room).emit('typing'));
    socket.on('stop typing', (room) => socket.in(room).emit('stop typing'));

    // ─── MESSAGES ────────────────────────────────────────────
    socket.on('new message', async (newMessage) => {
      const chat = newMessage.chat;
      if (!chat?.participants) return;

      chat.participants.forEach((participant) => {
        const participantId = participant._id || participant;
        if (participantId.toString() === newMessage.sender._id.toString()) return;

        // Check if receiver is online — emit delivery receipt back to sender
        const receiverRoom = io.sockets.adapter.rooms.get(participantId.toString());
        if (receiverRoom && receiverRoom.size > 0) {
          // Receiver is online — tell them about the message
          io.to(participantId.toString()).emit('message received', newMessage);
          // Tell the sender it was delivered
          io.to(newMessage.sender._id.toString()).emit('messageDelivered', {
            messageId: newMessage._id,
            chatId: newMessage.chat._id
          });
        } else {
          // Receiver offline — just emit to their user room (if they reconnect)
          io.to(participantId.toString()).emit('message received', newMessage);
        }
      });
    });

    // ─── SEEN ────────────────────────────────────────────────
    socket.on('messages seen', async ({ chatId, seenBy, senderId }) => {
      // Update DB
      try {
        await Message.updateMany(
          { chat: chatId, sender: senderId, status: { $ne: 'seen' } },
          { $set: { status: 'seen' } }
        );
      } catch (e) {
        console.error('Error updating seen status in socket:', e);
      }

      // Notify the original sender their messages were seen
      io.to(senderId.toString()).emit('messagesSeen', { chatId, seenBy });
    });

    // ─── FRIEND REQUESTS ─────────────────────────────────────
    socket.on('friend request sent', ({ toUserId, fromUser }) => {
      io.to(toUserId.toString()).emit('friendRequestReceived', {
        from: fromUser,
        message: `${fromUser.displayName} sent you a friend request`
      });
    });

    socket.on('friend request accepted', ({ toUserId, fromUser }) => {
      io.to(toUserId.toString()).emit('friendRequestAccepted', {
        from: fromUser,
        message: `${fromUser.displayName} accepted your friend request`
      });
    });

    // ─── CALLS (Socket signalling — Option B) ────────────────
    // Caller initiates
    socket.on('call:offer', async ({ to, callData }) => {
      // callData: { callId, callerId, callerName, callerPic, type }
      io.to(to.toString()).emit('call:incoming', callData);
    });

    // Receiver answers
    socket.on('call:answer', ({ to, callId }) => {
      io.to(to.toString()).emit('call:answered', { callId });
    });

    // Either side rejects before answer
    socket.on('call:reject', async ({ to, callId }) => {
      try {
        await Call.findByIdAndUpdate(callId, { status: 'rejected' });
      } catch (e) {}
      io.to(to.toString()).emit('call:rejected', { callId });
    });

    // Either side ends the call
    socket.on('call:end', async ({ to, callId, duration }) => {
      try {
        await Call.findByIdAndUpdate(callId, {
          status: 'completed',
          duration: duration || 0
        });
      } catch (e) {}
      io.to(to.toString()).emit('call:ended', { callId, duration });
    });

    // ─── DISCONNECT ──────────────────────────────────────────
    socket.on('disconnect', async () => {
      if (!socket.userId) return;
      try {
        const lastSeen = new Date();
        await User.findByIdAndUpdate(socket.userId, { isOnline: false, lastSeen });

        const user = await User.findById(socket.userId).populate('friends', '_id');
        if (user?.friends) {
          user.friends.forEach((friend) => {
            io.to(friend._id.toString()).emit('friendStatusUpdate', {
              userId: socket.userId,
              isOnline: false,
              lastSeen
            });
          });
        }
      } catch (error) {
        console.error('Error in disconnect socket handler:', error);
      }
    });
  });
};
