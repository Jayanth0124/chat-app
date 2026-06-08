import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuthStore } from './useAuthStore';
import { useNotificationStore } from './useNotificationStore';
import { useLayoutStore } from './useLayoutStore';
import { useFriendStore } from './useFriendStore';

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
    if (!user || get().socket) return;

    const socketUrl = import.meta.env.VITE_API_URL || 
      (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5000' 
        : 'https://chat-app-t2pz.onrender.com');
    const socket = io(socketUrl, { withCredentials: true });
    socket.connect();
    socket.emit('setup', user);
    set({ socket });


    // ── Message received ──────────────────────────────────────────────────
    socket.on('message received', async (newMessage) => {
      const { selectedChat, chats, unreadCounts } = get();
      const chatId = newMessage.chat?._id || newMessage.chat;
      const isCurrentChat = selectedChat && String(selectedChat._id) === String(chatId);

      // Update the chat's latestMessage in the list
      const updatedChats = chats.map((c) => {
        if (String(c._id) === String(chatId)) {
          return { ...c, latestMessage: newMessage, updatedAt: new Date().toISOString() };
        }
        return c;
      });
      // Move updated chat to top
      const chatIndex = updatedChats.findIndex((c) => String(c._id) === String(chatId));
      if (chatIndex > 0) {
        const [moved] = updatedChats.splice(chatIndex, 1);
        updatedChats.unshift(moved);
      }

      if (isCurrentChat) {
        // Prevent duplicate appending
        set((state) => {
          const messageExists = state.messages.some(m => m._id === newMessage._id);
          if (messageExists) return { chats: updatedChats };
          return { messages: [...state.messages, newMessage], chats: updatedChats };
        });
        // Mark as seen immediately since user is looking at this chat
        get().markChatAsSeen(chatId);
      } else {
        // Increment unread count for this chat
        const newUnread = { ...unreadCounts, [chatId]: (unreadCounts[chatId] || 0) + 1 };
        set({ chats: updatedChats, unreadCounts: newUnread });
      }
    });

    // ── Delivery receipt ──────────────────────────────────────────────────
    socket.on('messageDelivered', ({ messageId, chatId }) => {
      const { messages, selectedChat } = get();
      if (selectedChat && String(selectedChat._id) === String(chatId)) {
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
      if (selectedChat && String(selectedChat._id) === String(chatId)) {
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
      const ns = useNotificationStore.getState();
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

    socket.on('broadcastDeleted', ({ id }) => {
      const ns = useNotificationStore.getState();
      ns.removeNotification(id);
    });

    // ── Support / Bug Notifications ─────────────────────────────────────────
    socket.on('ticketUpdated', ({ ticket, actionType, message }) => {
      const ns = useNotificationStore.getState();
      ns.addNotification({
        id: `ticket-${ticket._id}-${Date.now()}`,
        type: 'system',
        title: `Ticket ${actionType}`,
        body: message,
      });
    });

    socket.on('bugUpdated', ({ bug, actionType, message }) => {
      const ns = useNotificationStore.getState();
      ns.addNotification({
        id: `bug-${bug._id}-${Date.now()}`,
        type: 'system',
        title: `Bug Report ${actionType}`,
        body: message,
      });
    });

    socket.on('adminNotification', ({ type, title, message }) => {
      const ns = useNotificationStore.getState();
      ns.addNotification({
        id: `admin-${Date.now()}`,
        type: 'system',
        title: title || 'Admin Alert',
        body: message,
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
    socket.on('userStatusUpdate', ({ userId, isOnline, lastSeen }) => {
      const { chats, selectedChat, users } = get();

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

      const updatedUsers = users.map(u => 
        (u._id === userId || u._id?.toString() === userId)
          ? { ...u, isOnline, lastSeen }
          : u
      );

      set({ chats: updatedChats, selectedChat: updatedSelectedChat, users: updatedUsers });
    });

    // ── Privacy Settings Updated ──────────────────────────────────────────
    socket.on('privacySettingsUpdated', ({ userId, onlineStatus, isOnline, lastSeen }) => {
      const { chats, selectedChat, users } = get();

      // Similar to userStatusUpdate, but we might need to hide them if they chose 'nobody'.
      // Actually, if we just use the provided 'isOnline' and 'lastSeen', it assumes the backend
      // already calculated if we can see them. Wait, the backend emits `privacySettingsUpdated` globally
      // with `isOnline: user.isOnline` (their actual state).
      // The frontend needs to determine if *we* can see them.
      // But since the user might be looking at their profile, we just refetch users for simplicity,
      // or just apply an offline state to them if their new status is 'nobody'.
      // For now, doing a full refresh of users/chats is safer if privacy changes.
      // Or just let it update the list. We'll simply set them offline locally.
      
      const newIsOnline = onlineStatus === 'nobody' ? false : isOnline;

      const updateParticipants = (participants) =>
        participants.map((p) =>
          (p._id === userId || p._id?.toString() === userId)
            ? { ...p, isOnline: newIsOnline, lastSeen }
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

      const updatedUsers = users.map(u => 
        (u._id === userId || u._id?.toString() === userId)
          ? { ...u, isOnline: newIsOnline, lastSeen }
          : u
      );

      set({ chats: updatedChats, selectedChat: updatedSelectedChat, users: updatedUsers });
    });

    // ── Profile Updates ───────────────────────────────────────────────────
    socket.on('userProfileUpdated', ({ userId, updatedData }) => {
      const { chats, selectedChat, users } = get();

      const updateParticipants = (participants) =>
        participants.map((p) =>
          (p._id === userId || p._id?.toString() === userId)
            ? { ...p, ...updatedData }
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

      const updatedUsers = users.map(u => 
        (u._id === userId || u._id?.toString() === userId)
          ? { ...u, ...updatedData }
          : u
      );

      set({ chats: updatedChats, selectedChat: updatedSelectedChat, users: updatedUsers });
      
      // Also trigger a refresh of friend store if needed, by calling getFriends
      // But we don't strictly need to do it forcefully, as users usually refresh the page 
      // or we can import useFriendStore
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
      useNotificationStore.getState().addNotification({
        type: 'friendRequest',
        title: 'Friend Request',
        body: message || `${from?.displayName} sent you a friend request`,
        avatar: from?.profilePic,
      });
    });

    socket.on('friendRequestAccepted', ({ from, message }) => {
      useNotificationStore.getState().addNotification({
        type: 'friendAccepted',
        title: 'Request Accepted',
        body: message || `${from?.displayName} accepted your friend request`,
        avatar: from?.profilePic,
      });
    });

    socket.on('relationshipUpdated', ({ otherUserId }) => {
      // Refresh friends and requests list
      useFriendStore.getState().getFriends();
      useFriendStore.getState().getRequests();
      
      // Refresh chats list
      get().fetchChats();
      
      // If the current chat is with this user, deselect it
      const currentSelectedChat = get().selectedChat;
      if (currentSelectedChat?.participants?.some(p => p._id === otherUserId || p._id?.toString() === otherUserId)) {
        get().setSelectedChat(null);
        toast.error('The conversation is no longer active.');
      }
    });

    // ── Incoming call ─────────────────────────────────────────────────────
    socket.on('call:incoming', (callData) => {
      // Store incoming call in layout store directly
      useLayoutStore.getState().setIncomingCall(callData);
    });

    socket.on('call:answered', ({ callId }) => {
      const { activeCall, setActiveCall } = useLayoutStore.getState();
      if (activeCall && activeCall.callId === callId) {
        setActiveCall({ ...activeCall, status: 'connected' });
      }
    });

    socket.on('call:rejected', ({ callId }) => {
      toast('Call was declined', { icon: '📵' });
      const { activeCall, setActiveCall, setIncomingCall } = useLayoutStore.getState();
      if (activeCall && activeCall.callId === callId) setActiveCall(null);
      setIncomingCall(null);
    });

    socket.on('call:ended', ({ callId, duration }) => {
      const { activeCall, setActiveCall, setIncomingCall } = useLayoutStore.getState();
      if (activeCall && activeCall.callId === callId) setActiveCall(null);
      setIncomingCall(null);
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
      String(c._id) === String(chatId)
        ? { ...c, latestMessage: tempMessage, updatedAt: new Date().toISOString() }
        : c
    );
    const idx = updatedChats.findIndex((c) => String(c._id) === String(chatId));
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
        String(c._id) === String(chatId) && String(c.latestMessage?._id) === String(tempId)
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

  pinChat: async (chatId, pin) => {
    try {
      const res = await axiosInstance.post(`/chat/${chatId}/pin`, { pin });
      import('./useAuthStore').then(({ useAuthStore }) => {
        const currentUser = useAuthStore.getState().user;
        useAuthStore.setState({ user: { ...currentUser, pinnedChats: res.data.pinnedChats } });
      });
      toast.success(pin ? 'Chat pinned' : 'Chat unpinned');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error pinning chat');
    }
  },

  muteChat: async (chatId, durationHours) => {
    try {
      const res = await axiosInstance.post(`/chat/${chatId}/mute`, { durationHours });
      import('./useAuthStore').then(({ useAuthStore }) => {
        const currentUser = useAuthStore.getState().user;
        useAuthStore.setState({ user: { ...currentUser, mutedChats: res.data.mutedChats } });
      });
      if (durationHours === false) {
        toast.success('Chat unmuted');
      } else {
        toast.success('Notifications muted');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error muting chat');
    }
  }
}));
