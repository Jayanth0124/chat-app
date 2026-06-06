import { create } from 'zustand';

const LOCAL_STORAGE_KEY = 'orbit_notifications';
const DISMISSED_KEY = 'orbit_dismissed_notifications';

const loadSavedNotifications = () => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    const now = Date.now();
    return parsed.filter((n) => {
      if (n.isPermanent) return true;
      const createdTime = new Date(n.createdAt).getTime();
      return now - createdTime < 24 * 60 * 60 * 1000;
    });
  } catch (err) {
    console.error("Failed to load notifications from localStorage:", err);
    return [];
  }
};

const getDismissedIds = () => {
  try {
    const saved = localStorage.getItem(DISMISSED_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const useNotificationStore = create((set, get) => ({
  notifications: loadSavedNotifications(),
  unreadCount: 0,

  addNotification: (notif) => {
    const id = notif.id || (Date.now() + Math.random().toString());
    const { notifications } = get();
    const dismissedIds = getDismissedIds();
    
    // If user dismissed this notification, do not add it
    if (dismissedIds.includes(id)) {
      return id;
    }
    
    if (notifications.some((n) => n.id === id)) {
      return id; // Duplicate notification, do not add
    }
    
    const newNotif = { 
      ...notif, 
      id, 
      createdAt: notif.createdAt || new Date().toISOString(),
      isPermanent: !!notif.isPermanent
    };
    
    const updated = [newNotif, ...notifications].slice(0, 50);
    set((state) => ({
      notifications: updated,
      unreadCount: state.unreadCount + 1
    }));
    
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return id;
  },

  addHistoricalNotifications: (notifs) => {
    const { notifications } = get();
    const dismissedIds = getDismissedIds();
    let updated = [...notifications];
    let addedAny = false;

    notifs.forEach((notif) => {
      const id = notif.id || notif._id;
      if (dismissedIds.includes(id)) return;
      if (updated.some((n) => n.id === id)) return;

      const newNotif = {
        id,
        type: 'system',
        title: notif.title || `Announcement (${notif.audience})`,
        body: notif.message || notif.body,
        isPermanent: !!notif.isPermanent,
        createdAt: notif.createdAt
      };
      updated.push(newNotif);
      addedAny = true;
    });

    if (addedAny) {
      // Sort newest first
      updated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      set({ notifications: updated.slice(0, 50) });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    }
  },

  removeNotification: (id) => {
    const { notifications } = get();
    const updated = notifications.filter((n) => n.id !== id);
    set({ notifications: updated });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    // Save in dismissed set so it doesn't show up again
    try {
      const dismissedIds = getDismissedIds();
      if (!dismissedIds.includes(id)) {
        dismissedIds.push(id);
        localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissedIds));
      }
    } catch (err) {
      console.error(err);
    }
  },

  clearAll: () => {
    const { notifications } = get();
    // Add all current IDs to dismissed
    try {
      const dismissedIds = getDismissedIds();
      notifications.forEach((n) => {
        if (!dismissedIds.includes(n.id)) {
          dismissedIds.push(n.id);
        }
      });
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissedIds));
    } catch (err) {
      console.error(err);
    }

    set({ notifications: [], unreadCount: 0 });
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  },

  markAllRead: () => set({ unreadCount: 0 }),

  cleanupExpired: () => {
    const { notifications } = get();
    const now = Date.now();
    const updated = notifications.filter((n) => {
      if (n.isPermanent) return true;
      const createdTime = new Date(n.createdAt).getTime();
      return now - createdTime < 24 * 60 * 60 * 1000;
    });
    if (updated.length !== notifications.length) {
      set({ notifications: updated });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    }
  }
}));
