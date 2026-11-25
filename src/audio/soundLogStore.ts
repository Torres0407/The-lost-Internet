import { create } from 'zustand';
import type { SoundId } from './soundRegistry';

export const MAX_SOUND_LOG_ENTRIES = 20;

export interface SoundLogEntry {
  id: string;
  soundId: SoundId;
  timestamp: number;
  text: string;
}

interface SoundLogState {
  entries: SoundLogEntry[];
  recordEntry: (soundId: SoundId, text: string, timestamp?: number) => SoundLogEntry;
  clearEntries: () => void;
}

let entryCounter = 0;

export const useSoundLogStore = create<SoundLogState>((set) => ({
  entries: [],

  recordEntry: (soundId, text, timestamp = Date.now()) => {
    entryCounter += 1;
    const entry: SoundLogEntry = {
      id: `sound-log-${timestamp}-${entryCounter}`,
      soundId,
      timestamp,
      text: text.trim(),
    };
    set((state) => {
      const next = [entry, ...state.entries].slice(0, MAX_SOUND_LOG_ENTRIES);
      return { entries: next };
    });
    return entry;
  },

  clearEntries: () => set({ entries: [] }),
}));
