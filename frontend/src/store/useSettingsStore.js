import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';

export const useSettingsStore = create((set) => ({
  settings: {},
  isLoadingSettings: false,
  fetchSettings: async () => {
    set({ isLoadingSettings: true });
    try {
      const res = await axiosInstance.get('/users/settings');
      set({ settings: res.data });
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      set({ isLoadingSettings: false });
    }
  },
  updateSettingAdmin: async (key, value) => {
    try {
      const res = await axiosInstance.post('/admin/settings', { key, value });
      set((state) => ({ settings: { ...state.settings, [key]: value } }));
      return res.data;
    } catch (err) {
      console.error('Failed to update setting:', err);
      throw err;
    }
  }
}));
