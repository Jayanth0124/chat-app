import { create } from 'zustand';

export const useLayoutStore = create((set) => ({
  isProfileOpen: false,
  isCallsOpen: false,
  isLogoutOpen: false,
  isSearchModalOpen: false,
  isSearchFriendsOpen: false,
  isManageFriendsOpen: false,
  isNotificationsOpen: false,
  activeCall: null, // { name: '', type: 'voice' | 'video', status: 'dialing' | 'connected' }
  activeAnnouncement: null, // { title, body, createdAt }

  setProfileOpen: (isOpen) => set({ isProfileOpen: isOpen }),
  setCallsOpen: (isOpen) => set({ isCallsOpen: isOpen }),
  setLogoutOpen: (isOpen) => set({ isLogoutOpen: isOpen }),
  setSearchModalOpen: (isOpen) => set({ isSearchModalOpen: isOpen }),
  setSearchFriendsOpen: (isOpen) => set({ isSearchFriendsOpen: isOpen }),
  setManageFriendsOpen: (isOpen) => set({ isManageFriendsOpen: isOpen }),
  setNotificationsOpen: (isOpen) => set({ isNotificationsOpen: isOpen }),
  setActiveCall: (call) => set({ activeCall: call }),
  setActiveAnnouncement: (announcement) => set({ activeAnnouncement: announcement }),
}));
