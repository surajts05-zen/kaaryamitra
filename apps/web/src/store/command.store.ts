import { create } from 'zustand';

interface CommandStore {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  toggle: () => void;
}

export const useCommandStore = create<CommandStore>((set) => ({
  isOpen: false,
  setOpen: (isOpen) => set({ isOpen }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));
