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
      const [res] = await Promise.all([
        axiosInstance.get('/users/friends'),
        new Promise(resolve => setTimeout(resolve, 600))
      ]);
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
      const [res] = await Promise.all([
        axiosInstance.get('/users/requests'),
        new Promise(resolve => setTimeout(resolve, 600))
      ]);
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
      // Add a minimum 600ms visual delay for premium loading animation feel
      const [res] = await Promise.all([
        axiosInstance.get(`/users/search?q=${query}`),
        new Promise(resolve => setTimeout(resolve, 600))
      ]);
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
      get().getRequests(); // Refresh requests list
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send request');
    }
  },

  acceptRequest: async (userId) => {
    try {
      await axiosInstance.post(`/users/accept/${userId}`);
      get().getRequests();
      get().getFriends();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to accept request');
    }
  },

  rejectRequest: async (userId) => {
    try {
      await axiosInstance.post(`/users/reject/${userId}`);
      get().getRequests();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject request');
    }
  },

  removeFriend: async (userId) => {
    try {
      await axiosInstance.delete(`/users/remove/${userId}`);
      get().getFriends();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to remove friend');
    }
  },

  blockUser: async (userId) => {
    try {
      await axiosInstance.post(`/users/block/${userId}`);
      get().getFriends();
      get().getRequests();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to block user');
    }
  },

  unblockUser: async (userId) => {
    try {
      await axiosInstance.post(`/users/unblock/${userId}`);
      get().getFriends();
      get().getRequests();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to unblock user');
    }
  }
}));
