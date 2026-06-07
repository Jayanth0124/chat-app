import { create } from 'zustand';

export const useConfirmStore = create((set) => ({
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  danger: false,
  resolve: null,

  confirm: ({ title = 'System Authorization', message, confirmText = 'Proceed', cancelText = 'Abort', danger = false }) => {
    return new Promise((resolve) => {
      set({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        danger,
        resolve: (val) => {
          set({ isOpen: false });
          setTimeout(() => resolve(val), 100); // small delay for animation
        }
      });
    });
  },

  handleConfirm: () => {
    set((state) => {
      if (state.resolve) state.resolve(true);
      return { isOpen: false };
    });
  },

  handleCancel: () => {
    set((state) => {
      if (state.resolve) state.resolve(false);
      return { isOpen: false };
    });
  }
}));
