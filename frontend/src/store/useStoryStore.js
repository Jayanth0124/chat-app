import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import { toast } from 'react-hot-toast';
import { useAuthStore } from './useAuthStore';

const useStoryStore = create((set, get) => ({
  stories: [],
  storyStats: null,
  isFetchingStories: false,
  isFetchingStats: false,
  isUploadingStory: false,
  activeStoryGroups: null,
  activeStoryGroupIndex: null,

  fetchStoryStats: async () => {
    set({ isFetchingStats: true });
    try {
      const res = await axiosInstance.get('/stories/stats');
      set({ storyStats: res.data });
    } catch (error) {
      console.error('Error fetching story stats:', error);
    } finally {
      set({ isFetchingStats: false });
    }
  },

  openStoryViewer: (groups, index) => set({ activeStoryGroups: groups, activeStoryGroupIndex: index }),
  closeStoryViewer: () => set({ activeStoryGroups: null, activeStoryGroupIndex: null }),

  openStoryForUser: (userId) => {
    const { stories } = get();
    if (!stories || stories.length === 0) return;
    
    // Deduplicate and sort chronologically
    const dedupedStories = Array.from(new Map(stories.map(s => [s._id, s])).values())
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const groupedStories = dedupedStories.reduce((acc, story) => {
      const uid = story.user._id;
      if (!acc[uid]) {
        acc[uid] = { user: story.user, stories: [], lastUpdated: new Date(story.createdAt) };
      }
      acc[uid].stories.push(story);
      if (new Date(story.createdAt) > acc[uid].lastUpdated) {
        acc[uid].lastUpdated = new Date(story.createdAt);
      }
      return acc;
    }, {});

    const allGroups = Object.values(groupedStories).sort((a, b) => b.lastUpdated - a.lastUpdated);
    const index = allGroups.findIndex(g => g.user._id === userId);
    
    if (index !== -1) {
      set({ activeStoryGroups: allGroups, activeStoryGroupIndex: index });
    }
  },

  fetchStories: async () => {
    set({ isFetchingStories: true });
    try {
      const res = await axiosInstance.get('/stories');
      // Merge active optimistic stories with fetched stories
      set(state => {
        const optimistics = state.stories.filter(s => s.isOptimistic);
        return { stories: [...optimistics, ...res.data] };
      });
    } catch (error) {
      console.error('Error fetching stories:', error);
      toast.error('Failed to load stories');
    } finally {
      set({ isFetchingStories: false });
    }
  },

  addOptimisticStory: (story) => {
    set(state => ({ stories: [story, ...state.stories] }));
  },

  removeOptimisticStory: (tempId) => {
    set(state => ({ stories: state.stories.filter(s => s._id !== tempId) }));
  },

  markOptimisticStoryFailed: (tempId) => {
    set(state => ({
      stories: state.stories.map(s => s._id === tempId ? { ...s, uploadFailed: true } : s)
    }));
  },

  createStory: async (storyData, optimisticId = null) => {
    // If optimistic UI is used, don't set global isUploadingStory to block UI
    if (!optimisticId) set({ isUploadingStory: true });
    
    try {
      const res = await axiosInstance.post('/stories', storyData);
      set((state) => {
        // Remove optimistic version if it exists
        const filteredStories = optimisticId ? state.stories.filter(s => s._id !== optimisticId) : state.stories;
        
        // Prevent duplicate insertion
        if (filteredStories.some(s => s._id === res.data._id)) return { isUploadingStory: false, stories: filteredStories };
        return { 
          stories: [res.data, ...(Array.isArray(filteredStories) ? filteredStories : [])],
          isUploadingStory: false 
        };
      });
      
      // Update stats if available
      const { storyStats } = get();
      if (storyStats) {
        set({ storyStats: { ...storyStats, totalStories: storyStats.totalStories + 1, storiesThisWeek: storyStats.storiesThisWeek + 1, storiesThisMonth: storyStats.storiesThisMonth + 1 } });
      }
      
      return res.data;
    } catch (error) {
      set({ isUploadingStory: false });
      if (optimisticId) {
        get().markOptimisticStoryFailed(optimisticId);
      } else {
        toast.error('Failed to post story');
      }
      console.error('Error creating story:', error);
      throw error;
    }
  },

  viewStory: async (storyId) => {
    try {
      await axiosInstance.post(`/stories/${storyId}/view`);
      // Update local state to mark as viewed by self
      const { authUser } = useAuthStore.getState(); // Need to access auth state safely
      set((state) => ({
        stories: state.stories.map(story => {
          if (story._id === storyId && authUser) {
            // only add if not already there
            const hasViewed = story.views.some(v => v.user === authUser._id || v.user._id === authUser._id);
            if (!hasViewed) {
              return { ...story, views: [...story.views, { user: authUser._id }] };
            }
          }
          return story;
        })
      }));
    } catch (error) {
      console.error('Error viewing story:', error);
    }
  },

  reactToStory: async (storyId, emoji) => {
    try {
      const res = await axiosInstance.post(`/stories/${storyId}/react`, { emoji });
      set((state) => ({
        stories: state.stories.map(s => s._id === storyId ? res.data.story : s)
      }));
    } catch (error) {
      console.error('Error reacting to story:', error);
      toast.error('Failed to react');
    }
  },

  deleteStory: async (storyId) => {
    try {
      await axiosInstance.delete(`/stories/${storyId}`);
      set((state) => ({
        stories: state.stories.filter(s => s._id !== storyId)
      }));
    } catch (error) {
      if (error.response?.status === 404) {
        set((state) => ({
          stories: state.stories.filter(s => s._id !== storyId)
        }));
      } else {
        console.error('Error deleting story:', error);
        toast.error('Failed to delete story');
      }
    }
  },

  updateStoryPrivacy: async (storyId, privacyData) => {
    try {
      const res = await axiosInstance.put(`/stories/${storyId}/privacy`, privacyData);
      set((state) => ({
        stories: state.stories.map(s => s._id === storyId ? res.data : s)
      }));
      toast.success('Story privacy updated');
    } catch (error) {
      console.error('Error updating story privacy:', error);
      toast.error('Failed to update privacy');
    }
  },


  // Socket event handlers
  initStorySockets: (socket) => {
    if (!socket) return;
    
    socket.off("newStory");
    socket.off("storyUpdated");
    socket.off("storyDeleted");

    socket.on("newStory", (story) => {
      set((state) => {
        if (state.stories.some(s => s._id === story._id)) return state;
        return { stories: [story, ...state.stories] };
      });
    });

    socket.on("storyUpdated", (updatedStory) => {
      set((state) => ({
        stories: state.stories.map(story => 
          story._id === updatedStory._id ? updatedStory : story
        )
      }));
    });

    socket.on("storyDeleted", ({ storyId }) => {
      set((state) => ({
        stories: state.stories.filter(s => s._id !== storyId)
      }));
    });
  },

  cleanupStorySockets: (socket) => {
    if (!socket) return;
    socket.off("newStory");
    socket.off("storyUpdated");
    socket.off("storyDeleted");
  }
}));

export default useStoryStore;
