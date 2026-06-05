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
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post('/auth/signup', data);
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
      set({ user: null, isAuthenticated: false });
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error logging out');
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
}));

