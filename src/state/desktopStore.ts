import { create } from 'zustand';
import type { DesktopAppId } from '../os/types';

interface DesktopState {
  selectedIconId: DesktopAppId | null;
  lastActivatedIconId: DesktopAppId | null;
  selectIcon: (id: DesktopAppId | null) => void;
  activateIcon: (id: DesktopAppId) => void;
  clearSelection: () => void;
}

export const useDesktopStore = create<DesktopState>((set) => ({
  selectedIconId: null,
  lastActivatedIconId: null,
  selectIcon: (id) => set({ selectedIconId: id }),
  activateIcon: (id) =>
    set({
      selectedIconId: id,
      lastActivatedIconId: id,
    }),
  clearSelection: () =>
    set({
      selectedIconId: null,
      lastActivatedIconId: null,
    }),
}));
