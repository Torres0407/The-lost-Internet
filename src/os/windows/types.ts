import type { AppId } from '../types';

export interface WindowRecord {
  id: string;
  appId: AppId;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  maximized: boolean;
  zIndex: number;
}

export interface WindowsStateSnapshot {
  windows: Record<string, WindowRecord>;
  focusedId: string | null;
  zCounter: number;
}

export interface ViewportBounds {
  width: number;
  height: number;
}
