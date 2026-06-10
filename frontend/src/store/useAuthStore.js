import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isCheckingAuth: true,
  isLoggingIn: false,
  isSigningUp: false,
  isUpdatingProfile: false,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get('/auth/me');
      set({ user: res.data, isAuthenticated: true });
    } catch (error) {
      console.log('Error in checkAuth:', error);
      localStorage.removeItem('token');
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post('/auth/signup', data);
      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
      }
      set({ user: res.data, isAuthenticated: true });
      toast.success('Account created successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post('/auth/login', data);
      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
      }
      set({ user: res.data, isAuthenticated: true });
      toast.success('Logged in successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid credentials');
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch (error) {
      console.error('Error logging out on server:', error);
    } finally {
      // 1. Purge LocalStorage
      localStorage.removeItem('token');
      
      // 2. Clear Auth State
      set({ user: null, isAuthenticated: false });
      
      // 3. Disconnect Sockets safely via dynamic import to avoid circular dependencies
      import('./useChatStore').then(({ useChatStore }) => {
        useChatStore.getState().disconnectSocket();
        useChatStore.setState({ chats: [], messages: [], selectedChat: null, unreadCounts: {} });
      });

      // 4. Purge Notifications
      import('./useNotificationStore').then(({ useNotificationStore }) => {
        useNotificationStore.setState({ notifications: [], unreadCount: 0 });
      });

      // 5. Purge Layout State
      import('./useLayoutStore').then(({ useLayoutStore }) => {
        useLayoutStore.setState({ activeCall: null, incomingCall: null });
      });

      toast.success('Logged out successfully');
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put('/user/update-profile', data);
      set({ user: res.data });
      toast.success('Profile updated successfully');
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
      throw error;
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  changeUsername: async (username) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put('/user/change-username', { username });
      set({ user: res.data });
      toast.success('Username changed successfully');
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change username');
      throw error;
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  updatePrivacySettings: async (settings) => {
    try {
      const res = await axiosInstance.put('/user/privacy', settings);
      set((state) => ({ user: { ...state.user, privacySettings: res.data.privacySettings } }));
      toast.success('Privacy settings updated');
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update privacy settings');
      throw error;
    }
  },

  forgotPassword: async (email) => {
    try {
      const res = await axiosInstance.post('/auth/forgot-password', { email });
      toast.success(res.data.message);
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
      throw error;
    }
  },

  resetPassword: async (token, password) => {
    try {
      const res = await axiosInstance.post(`/auth/reset-password/${token}`, { password });
      toast.success(res.data.message);
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
      throw error;
    }
  },
}));

