import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    try {
      set({ isLoading: true });
      const res = await axiosInstance.get('/notifications');
      const notifications = res.data.map(n => ({ ...n, isHistorical: true }));
      const unreadCount = notifications.filter(n => !n.isRead).length;
      set({ notifications, unreadCount, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      set({ isLoading: false });
    }
  },

  addNotification: (notif) => {
    // Check for duplicate by ID if it's already in the store
    const { notifications } = get();
    if (notifications.some((n) => n._id === notif.id || n.id === notif.id)) {
      return notif.id;
    }
    
    // Convert incoming socket notifs to backend format
    const newNotif = { 
      ...notif, 
      _id: notif.id || (Date.now() + Math.random().toString()),
      isRead: false,
      createdAt: notif.createdAt || new Date().toISOString(),
      isPermanent: !!notif.isPermanent
    };
    
    const updated = [newNotif, ...notifications].slice(0, 50);
    set((state) => ({
      notifications: updated,
      unreadCount: state.unreadCount + 1
    }));
    
    return newNotif._id;
  },

  markAsRead: async (id) => {
    const { notifications, unreadCount } = get();
    const updated = notifications.map(n => 
      (n._id === id || n.id === id) ? { ...n, isRead: true } : n
    );
    
    set({ 
      notifications: updated, 
      unreadCount: Math.max(0, unreadCount - 1) 
    });

    try {
      await axiosInstance.put(`/notifications/${id}/read`);
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  },

  markAllRead: async () => {
    const { notifications } = get();
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    set({ notifications: updated, unreadCount: 0 });

    try {
      await axiosInstance.put('/notifications/read-all');
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  },

  removeNotification: async (id) => {
    const { notifications, unreadCount } = get();
    const notifToRemove = notifications.find(n => (n._id === id || n.id === id));
    
    const updated = notifications.filter((n) => n._id !== id && n.id !== id);
    const newUnreadCount = notifToRemove && !notifToRemove.isRead ? Math.max(0, unreadCount - 1) : unreadCount;
    
    set({ notifications: updated, unreadCount: newUnreadCount });

    try {
      await axiosInstance.delete(`/notifications/${id}`);
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  },

  clearAll: async () => {
    set({ notifications: [], unreadCount: 0 });
    try {
      await axiosInstance.delete('/notifications/all');
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  }
}));
