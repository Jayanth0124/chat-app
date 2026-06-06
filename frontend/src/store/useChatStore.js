import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuthStore } from './useAuthStore';

export const useChatStore = create((set, get) => ({
  users: [],
  chats: [],
  messages: [],
  selectedChat: null,
  isUsersLoading: false,
  isChatsLoading: false,
  isMessagesLoading: false,
  socket: null,
  // unreadCounts: map of chatId -> number (computed locally from socket events)
  unreadCounts: {},

  // ─── SOCKET ──────────────────────────────────────────────────────────────
  connectSocket: (user) => {
    if (!user || get().socket?.connected) return;

    const socketUrl = import.meta.env.VITE_API_URL || 
      (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5000' 
        : 'https://chat-app-t2pz.onrender.com');
    const socket = io(socketUrl, { withCredentials: true });
    socket.connect();
    socket.emit('setup', user);
    set({ socket });

    // Lazy import to avoid circular dependency
    const getNotifStore = () => import('./useNotificationStore').then((m) => m.useNotificationStore.getState());

    // ── Message received ──────────────────────────────────────────────────
    socket.on('message received', async (newMessage) => {
      const { selectedChat, chats, unreadCounts } = get();
      const chatId = newMessage.chat?._id || newMessage.chat;
      const isCurrentChat = selectedChat && selectedChat._id === chatId;

      // Update the chat's latestMessage in the list
      const updatedChats = chats.map((c) => {
        if (c._id === chatId) {
          return { ...c, latestMessage: newMessage, updatedAt: new Date().toISOString() };
        }
        return c;
      });
      // Move updated chat to top
      const chatIndex = updatedChats.findIndex((c) => c._id === chatId);
      if (chatIndex > 0) {
        const [moved] = updatedChats.splice(chatIndex, 1);
        updatedChats.unshift(moved);
      }

      if (isCurrentChat) {
        // Append to current messages view
        set((state) => ({ messages: [...state.messages, newMessage], chats: updatedChats }));
        // Mark as seen immediately since user is looking at this chat
        get().markChatAsSeen(chatId);
      } else {
        // Increment unread count for this chat
        const newUnread = { ...unreadCounts, [chatId]: (unreadCounts[chatId] || 0) + 1 };
        set({ chats: updatedChats, unreadCounts: newUnread });

        // Trigger in-app notification
        const senderName = newMessage.sender?.displayName || 'Someone';
        const senderPic = newMessage.sender?.profilePic;
        const preview = newMessage.messageType === 'image'
          ? '📷 Image'
          : newMessage.content?.substring(0, 60) || 'New message';

        getNotifStore().then((ns) => ns.addNotification({
          type: 'message',
          title: senderName,
          body: preview,
          avatar: senderPic,
          chatId,
          from: newMessage.sender?._id || newMessage.sender,
        }));
      }
    });

    // ── Delivery receipt ──────────────────────────────────────────────────
    socket.on('messageDelivered', ({ messageId, chatId }) => {
      const { messages, selectedChat } = get();
      if (selectedChat?._id === chatId) {
        const updatedMessages = messages.map((m) =>
          m._id === messageId && m.status === 'sent'
            ? { ...m, status: 'delivered' }
            : m
        );
        set({ messages: updatedMessages });
      }
    });

    // ── Seen receipt ──────────────────────────────────────────────────────
    socket.on('messagesSeen', ({ chatId, seenBy, updatedMessages }) => {
      const { messages, selectedChat } = get();
      if (selectedChat && selectedChat._id === chatId) {
        const updated = messages.map((m) => {
          const found = updatedMessages?.find((u) => u._id === m._id);
          if (found) {
            return {
              ...m,
              status: 'seen',
              expiresAt: found.expiresAt,
              content: found.content,
              mediaUrl: found.mediaUrl,
              isViewed: found.isViewed
            };
          }
          return m;
        });
        set({ messages: updated });
      }
      // Clear unread for the person who just saw it (if it's our message being seen)
      const { unreadCounts } = get();
      if (unreadCounts[chatId]) {
        const newUnread = { ...unreadCounts };
        delete newUnread[chatId];
        set({ unreadCounts: newUnread });
      }
    });

    // ── Broadcast notification ────────────────────────────────────────────
    socket.on('broadcastNotification', ({ id, message, audience, sender, isPermanent, expiresAt }) => {
      getNotifStore().then((ns) => {
        ns.addNotification({
          id,
          type: 'system',
          title: `Announcement (${audience})`,
          body: message,
          avatar: null,
          isPermanent: !!isPermanent,
          expiresAt
        });
      });
    });

    socket.on('broadcastDeleted', ({ id }) => {
      getNotifStore().then((ns) => {
        ns.removeNotification(id);
      });
    });

    // ── Chat deleted ──────────────────────────────────────────────────────
    socket.on('chatDeleted', ({ chatId }) => {
      const { chats, selectedChat } = get();
      const updatedChats = chats.filter((c) => c._id !== chatId);
      let updatedSelectedChat = selectedChat;
      if (selectedChat?._id === chatId) {
        updatedSelectedChat = null;
      }
      set({ chats: updatedChats, selectedChat: updatedSelectedChat });
      toast.success('Conversation deleted');
    });

    // ── Message deleted ───────────────────────────────────────────────────
    socket.on('messageDeleted', ({ messageId, chatId }) => {
      const { messages, selectedChat, chats } = get();
      if (selectedChat?._id === chatId) {
        const updatedMessages = messages.filter((m) => m._id !== messageId);
        set({ messages: updatedMessages });
      }
      const updatedChats = chats.map((c) => {
        if (c._id === chatId && c.latestMessage?._id === messageId) {
          return {
            ...c,
            latestMessage: {
              ...c.latestMessage,
              content: "Message deleted",
              messageType: "text"
            }
          };
        }
        return c;
      });
      set({ chats: updatedChats });
    });

    // ── Chat marked unread ────────────────────────────────────────────────
    socket.on('chatMarkedUnread', ({ chatId }) => {
      const { unreadCounts } = get();
      const newUnread = { ...unreadCounts, [chatId]: (unreadCounts[chatId] || 0) + 1 };
      set({ unreadCounts: newUnread });
    });

    // ── Online status ─────────────────────────────────────────────────────
    socket.on('friendStatusUpdate', ({ userId, isOnline, lastSeen }) => {
      const { chats, selectedChat } = get();

      const updateParticipants = (participants) =>
        participants.map((p) =>
          (p._id === userId || p._id?.toString() === userId)
            ? { ...p, isOnline, lastSeen }
            : p
        );

      const updatedChats = chats.map((c) => ({
        ...c,
        participants: updateParticipants(c.participants)
      }));

      let updatedSelectedChat = selectedChat;
      if (selectedChat) {
        updatedSelectedChat = {
          ...selectedChat,
          participants: updateParticipants(selectedChat.participants)
        };
      }

      set({ chats: updatedChats, selectedChat: updatedSelectedChat });
    });

    // ── Vanish mode changed ───────────────────────────────────────────────
    socket.on('vanishModeChanged', ({ chatId, vanishMode }) => {
      const { chats, selectedChat } = get();
      const updatedChats = chats.map((c) =>
        c._id === chatId ? { ...c, vanishMode } : c
      );
      let updatedSelectedChat = selectedChat;
      if (selectedChat?._id === chatId) {
        updatedSelectedChat = { ...selectedChat, vanishMode };
      }
      set({ chats: updatedChats, selectedChat: updatedSelectedChat });
    });

    // ── Friend request notifications ──────────────────────────────────────
    socket.on('friendRequestReceived', ({ from, message }) => {
      getNotifStore().then((ns) => ns.addNotification({
        type: 'friendRequest',
        title: 'Friend Request',
        body: message || `${from?.displayName} sent you a friend request`,
        avatar: from?.profilePic,
      }));
      toast(`${from?.displayName} sent you a friend request`, { icon: '👋' });
    });

    socket.on('friendRequestAccepted', ({ from, message }) => {
      getNotifStore().then((ns) => ns.addNotification({
        type: 'friendAccepted',
        title: 'Request Accepted',
        body: message || `${from?.displayName} accepted your friend request`,
        avatar: from?.profilePic,
      }));
      toast.success(`${from?.displayName} accepted your friend request`);
    });

    // ── Incoming call ─────────────────────────────────────────────────────
    socket.on('call:incoming', (callData) => {
      // callData: { callId, callerId, callerName, callerPic, type }
      const { setActiveCall } = (get()._layoutRef || {});

      getNotifStore().then((ns) => ns.addNotification({
        type: callData.type === 'video' ? 'callVideo' : 'callIncoming',
        title: `Incoming ${callData.type === 'video' ? 'Video' : 'Voice'} Call`,
        body: `${callData.callerName} is calling...`,
        avatar: callData.callerPic,
      }));

      // Store incoming call in layout store via event — App.jsx listens
      window.dispatchEvent(new CustomEvent('orbit:incomingCall', { detail: callData }));
    });

    socket.on('call:answered', ({ callId }) => {
      window.dispatchEvent(new CustomEvent('orbit:callAnswered', { detail: { callId } }));
    });

    socket.on('call:rejected', ({ callId }) => {
      window.dispatchEvent(new CustomEvent('orbit:callRejected', { detail: { callId } }));
    });

    socket.on('call:ended', ({ callId, duration }) => {
      window.dispatchEvent(new CustomEvent('orbit:callEnded', { detail: { callId, duration } }));
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket?.connected) socket.disconnect();
    set({ socket: null });
  },

  // ─── API ACTIONS ─────────────────────────────────────────────────────────
  getUsersForSidebar: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get('/users');
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error fetching users');
    } finally {
      set({ isUsersLoading: false });
    }
  },

  accessChat: async (userId) => {
    try {
      const res = await axiosInstance.post('/chat', { userId });
      const { chats } = get();
      if (!chats.find((c) => c._id === res.data._id)) {
        set({ chats: [res.data, ...chats] });
      }
      get().setSelectedChat(res.data);
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error accessing chat');
    }
  },

  fetchChats: async () => {
    set({ isChatsLoading: true });
    try {
      const res = await axiosInstance.get('/chat');
      // Build unreadCounts map from the backend-computed values
      const unreadCounts = {};
      res.data.forEach((c) => {
        if (c.unreadCount > 0) unreadCounts[c._id] = c.unreadCount;
      });
      set({ chats: res.data, unreadCounts });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error fetching chats');
    } finally {
      set({ isChatsLoading: false });
    }
  },

  getMessages: async (chatId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/chat/${chatId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error fetching messages');
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const tempId = `temp-${Date.now()}`;
    const currentUser = useAuthStore.getState().user;
    const chatId = messageData.chatId;

    // Create a high-fidelity temporary message for optimistic rendering
    const tempMessage = {
      _id: tempId,
      sender: {
        _id: currentUser?._id,
        displayName: currentUser?.displayName || 'Me',
        profilePic: currentUser?.profilePic || null
      },
      content: messageData.content || "",
      chat: chatId,
      messageType: messageData.messageType || "text",
      mediaUrl: messageData.mediaUrl || null,
      status: 'sending',
      createdAt: new Date().toISOString(),
      replyTo: messageData.replyToId ? get().messages.find(m => m._id === messageData.replyToId) : null,
      isViewOnce: messageData.isViewOnce || false
    };

    // 1. Immediately append to message list
    set((state) => ({ messages: [...state.messages, tempMessage] }));

    // 2. Immediately update the latestMessage and bubble chat to top
    const { chats } = get();
    const updatedChats = chats.map((c) =>
      c._id === chatId
        ? { ...c, latestMessage: tempMessage, updatedAt: new Date().toISOString() }
        : c
    );
    const idx = updatedChats.findIndex((c) => c._id === chatId);
    if (idx > 0) {
      const [moved] = updatedChats.splice(idx, 1);
      updatedChats.unshift(moved);
    }
    set({ chats: updatedChats });

    // 3. Make HTTP request in background
    try {
      const res = await axiosInstance.post('/chat/message', messageData);

      // 4. Swap temp message with real backend message
      set((state) => ({
        messages: state.messages.map((m) => (m._id === tempId ? res.data : m))
      }));

      // 5. Update the latestMessage with real backend message
      const { chats: currentChats } = get();
      const finalChats = currentChats.map((c) =>
        c._id === chatId && c.latestMessage?._id === tempId
          ? { ...c, latestMessage: res.data }
          : c
      );
      set({ chats: finalChats });

      // 6. Emit via socket
      const socket = get().socket;
      if (socket) {
        socket.emit('new message', res.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error sending message');
      // Remove the failed temporary message
      set((state) => ({
        messages: state.messages.filter((m) => m._id !== tempId)
      }));
    }
  },

  markViewOnceOpened: async (messageId) => {
    try {
      const res = await axiosInstance.post(`/chat/message/${messageId}/view`);
      const { messages } = get();
      const updatedMessages = messages.map((m) =>
        m._id === messageId ? res.data : m
      );
      set({ messages: updatedMessages });

      const socket = get().socket;
      if (socket) socket.emit('message viewed', res.data);
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error opening message');
    }
  },

  markChatAsSeen: async (chatId) => {
    try {
      await axiosInstance.post(`/chat/${chatId}/seen`);
      // Clear local unread count
      const { unreadCounts } = get();
      if (unreadCounts[chatId]) {
        const newUnread = { ...unreadCounts };
        delete newUnread[chatId];
        set({ unreadCounts: newUnread });
      }
    } catch (error) {
      console.error('Error marking chat as seen:', error);
    }
  },

  updateVanishMode: async (chatId, vanishMode) => {
    try {
      const res = await axiosInstance.put(`/chat/${chatId}/vanish`, { vanishMode });
      const { chats, selectedChat } = get();
      const updatedChats = chats.map((c) => (c._id === chatId ? res.data : c));
      let updatedSelectedChat = selectedChat;
      if (selectedChat?._id === chatId) updatedSelectedChat = res.data;
      set({ chats: updatedChats, selectedChat: updatedSelectedChat });
      toast.success(`Vanish mode: ${vanishMode}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating vanish mode');
    }
  },

  deleteChat: async (chatId) => {
    try {
      await axiosInstance.delete(`/chat/${chatId}`);
      const { chats, selectedChat } = get();
      const updatedChats = chats.filter((c) => c._id !== chatId);
      let updatedSelectedChat = selectedChat;
      if (selectedChat?._id === chatId) {
        updatedSelectedChat = null;
      }
      set({ chats: updatedChats, selectedChat: updatedSelectedChat });
      toast.success('Conversation deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting conversation');
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/chat/message/${messageId}`);
      const { messages } = get();
      set({ messages: messages.filter((m) => m._id !== messageId) });
      toast.success('Message deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting message');
    }
  },

  reportMessage: async (messageId, reason, details) => {
    try {
      await axiosInstance.post(`/chat/message/${messageId}/report`, { reason, details });
      toast.success('Message reported successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error reporting message');
    }
  },

  markChatAsUnread: async (chatId) => {
    try {
      await axiosInstance.post(`/chat/${chatId}/unread`);
      const { unreadCounts } = get();
      const newUnread = { ...unreadCounts, [chatId]: (unreadCounts[chatId] || 0) + 1 };
      set({ unreadCounts: newUnread });
      toast.success('Conversation marked as unread');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error marking conversation as unread');
    }
  },

  setSelectedChat: (chat) => {
    set({ selectedChat: chat });
    const socket = get().socket;
    if (chat && socket) {
      socket.emit('join chat', chat._id);
    }
    // Clear unread for selected chat
    if (chat) {
      const { unreadCounts } = get();
      if (unreadCounts[chat._id]) {
        const newUnread = { ...unreadCounts };
        delete newUnread[chat._id];
        set({ unreadCounts: newUnread });
      }
    }
  },
}));
