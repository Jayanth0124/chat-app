import { create } from 'zustand';

export const useNotificationStore = create((set, get) => ({
  notifications: [],   // { id, type, title, body, avatar, chatId, from }
  unreadCount: 0,

  addNotification: (notif) => {
    const id = Date.now() + Math.random();
    const newNotif = { ...notif, id, createdAt: new Date() };
    set((state) => ({
      notifications: [newNotif, ...state.notifications].slice(0, 50),
      unreadCount: state.unreadCount + 1
    }));
    return id;
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id)
    }));
  },

  clearAll: () => set({ notifications: [], unreadCount: 0 }),

  markAllRead: () => set({ unreadCount: 0 })
}));
