import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';

export const useFriendStore = create((set, get) => ({
  friends: [],
  incomingRequests: [],
  outgoingRequests: [],
  searchResults: [],
  isLoading: false,
  isSearching: false,

  getFriends: async () => {
    try {
      set({ isLoading: true });
      const res = await axiosInstance.get('/users/friends');
      set({ friends: res.data || [] });
    } catch (error) {
      console.error('Error fetching friends:', error);
      toast.error(error.response?.data?.error || 'Failed to load friends');
    } finally {
      set({ isLoading: false });
    }
  },

  getRequests: async () => {
    try {
      set({ isLoading: true });
      const res = await axiosInstance.get('/users/requests');
      set({ 
        incomingRequests: res.data?.incoming || [], 
        outgoingRequests: res.data?.outgoing || [] 
      });
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  searchUsers: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }
    
    try {
      set({ isSearching: true });
      const res = await axiosInstance.get(`/users/search?q=${query}`);
      set({ searchResults: res.data || [] });
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Search failed');
    } finally {
      set({ isSearching: false });
    }
  },

  sendRequest: async (userId) => {
    try {
      await axiosInstance.post(`/users/request/${userId}`);
      toast.success('Friend request sent');
      get().getRequests(); // Refresh requests list
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send request');
    }
  },

  acceptRequest: async (userId) => {
    try {
      await axiosInstance.post(`/users/accept/${userId}`);
      toast.success('Friend request accepted');
      get().getRequests();
      get().getFriends();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to accept request');
    }
  },

  rejectRequest: async (userId) => {
    try {
      await axiosInstance.post(`/users/reject/${userId}`);
      toast.success('Friend request rejected');
      get().getRequests();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject request');
    }
  },

  removeFriend: async (userId) => {
    try {
      await axiosInstance.delete(`/users/remove/${userId}`);
      toast.success('Friend removed');
      get().getFriends();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to remove friend');
    }
  },

  blockUser: async (userId) => {
    try {
      await axiosInstance.post(`/users/block/${userId}`);
      toast.success('User blocked');
      get().getFriends();
      get().getRequests();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to block user');
    }
  }
}));
