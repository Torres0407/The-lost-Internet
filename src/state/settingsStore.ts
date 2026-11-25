import { create } from 'zustand';
import {
  createDefaultSettings,
  parseSettings,
  resolveContrast,
  resolveMotion,
  serializeSettings,
  SETTINGS_STORAGE_KEY,
  textScaleToMultiplier,
  validateSettings,
  type ContrastSetting,
  type MotionSetting,
  type Settings,
  type TextScale,
} from '../engine/settings';

export type SettingsTabId = 'display' | 'sound' | 'accessibility' | 'save';

export interface SettingsStoreState extends Settings {
  systemReducedMotion: boolean;
  systemHighContrast: boolean;
  forcedHighContrastOverride: boolean;
  sessionMusicMuted: boolean;
  bootReplayToken: number;
  requestedSettingsTab: SettingsTabId | null;

  setAudioEnabled: (enabled: boolean) => void;
  setAudioChoiceMade: (made: boolean) => void;
  acceptBootAudioChoice: (enabled: boolean) => void;
  setMasterVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  setEffectsVolume: (volume: number) => void;
  setModemSound: (enabled: boolean) => void;
  setSoundLogVisible: (visible: boolean) => void;
  setTextScale: (scale: TextScale) => void;
  setContrast: (contrast: ContrastSetting) => void;
  setMotion: (motion: MotionSetting) => void;
  setScanlines: (scanlines: boolean) => void;
  setGlitchEffects: (enabled: boolean) => void;
  setSessionMusicMuted: (muted: boolean) => void;
  toggleSessionMusicMuted: () => void;
  toggleForcedHighContrastOverride: () => void;
  triggerBootReplay: () => void;
  requestSettingsTab: (tab: SettingsTabId | null) => void;
  resetSettings: () => void;
  setSystemPreferences: (prefs: {
    reducedMotion?: boolean;
    highContrast?: boolean;
  }) => void;
}

function readSettingsFromStorage(): Settings {
  if (typeof window === 'undefined') {
    return createDefaultSettings();
  }
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    return parseSettings(raw);
  } catch {
    return createDefaultSettings();
  }
}

export function writeSettingsToStorage(settings: Settings): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, serializeSettings(settings));
  } catch {
    // Ignore storage quota / security errors cleanly
  }
}

function queryMatchMedia(query: string): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  try {
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

export function applySettingsToDocument(state: {
  contrast: ContrastSetting;
  motion: MotionSetting;
  scanlines: boolean;
  glitchEffects: boolean;
  textScale: TextScale;
  systemReducedMotion: boolean;
  systemHighContrast: boolean;
  forcedHighContrastOverride: boolean;
}): void {
  if (typeof document === 'undefined' || !document.documentElement) {
    return;
  }
  const root = document.documentElement;
  const resolvedContrast = resolveContrast(
    state.contrast,
    state.systemHighContrast,
    state.forcedHighContrastOverride
  );
  const resolvedMotion = resolveMotion(state.motion, state.systemReducedMotion);

  root.setAttribute('data-contrast', resolvedContrast);
  root.setAttribute('data-motion', resolvedMotion);
  root.setAttribute('data-scanlines', state.scanlines ? 'true' : 'false');
  root.setAttribute(
    'data-glitch',
    state.glitchEffects && resolvedMotion !== 'reduced' ? 'true' : 'false'
  );
  root.style.setProperty('--text-scale', String(textScaleToMultiplier(state.textScale)));
}

function pickSettings(state: SettingsStoreState): Settings {
  return validateSettings({
    version: state.version,
    audioEnabled: state.audioEnabled,
    audioChoiceMade: state.audioChoiceMade,
    masterVolume: state.masterVolume,
    musicVolume: state.musicVolume,
    effectsVolume: state.effectsVolume,
    modemSound: state.modemSound,
    soundLogVisible: state.soundLogVisible,
    textScale: state.textScale,
    contrast: state.contrast,
    motion: state.motion,
    scanlines: state.scanlines,
    glitchEffects: state.glitchEffects,
  });
}

const initialSettings = readSettingsFromStorage();
const initialReducedMotion = queryMatchMedia('(prefers-reduced-motion: reduce)');
const initialHighContrast = queryMatchMedia('(prefers-contrast: more)');

export const useSettingsStore = create<SettingsStoreState>((set, get) => {
  const updateSettings = (patch: Partial<Settings>) => {
    set((prev) => {
      const nextSettings = validateSettings({
        ...pickSettings(prev),
        ...patch,
      });
      writeSettingsToStorage(nextSettings);
      const nextState = { ...prev, ...nextSettings };
      applySettingsToDocument(nextState);
      return nextSettings;
    });
  };

  return {
    ...initialSettings,
    systemReducedMotion: initialReducedMotion,
    systemHighContrast: initialHighContrast,
    forcedHighContrastOverride: false,
    sessionMusicMuted: false,
    bootReplayToken: 0,
    requestedSettingsTab: null,

    setAudioEnabled: (audioEnabled) => updateSettings({ audioEnabled }),
    setAudioChoiceMade: (audioChoiceMade) => updateSettings({ audioChoiceMade }),
    acceptBootAudioChoice: (audioEnabled) =>
      updateSettings({ audioEnabled, audioChoiceMade: true }),
    setMasterVolume: (masterVolume) => updateSettings({ masterVolume }),
    setMusicVolume: (musicVolume) => updateSettings({ musicVolume }),
    setEffectsVolume: (effectsVolume) => updateSettings({ effectsVolume }),
    setModemSound: (modemSound) => updateSettings({ modemSound }),
    setSoundLogVisible: (soundLogVisible) => updateSettings({ soundLogVisible }),
    setTextScale: (textScale) => updateSettings({ textScale }),
    setContrast: (contrast) => updateSettings({ contrast }),
    setMotion: (motion) => updateSettings({ motion }),
    setScanlines: (scanlines) => updateSettings({ scanlines }),
    setGlitchEffects: (glitchEffects) => updateSettings({ glitchEffects }),

    setSessionMusicMuted: (sessionMusicMuted) => set({ sessionMusicMuted }),
    toggleSessionMusicMuted: () =>
      set((state) => ({ sessionMusicMuted: !state.sessionMusicMuted })),
    toggleForcedHighContrastOverride: () =>
      set((state) => {
        const next = !state.forcedHighContrastOverride;
        applySettingsToDocument({ ...state, forcedHighContrastOverride: next });
        return { forcedHighContrastOverride: next };
      }),

    triggerBootReplay: () =>
      set((state) => ({ bootReplayToken: state.bootReplayToken + 1 })),

    requestSettingsTab: (requestedSettingsTab) => set({ requestedSettingsTab }),

    resetSettings: () => {
      const defaults = createDefaultSettings();
      writeSettingsToStorage(defaults);
      const prev = get();
      const nextState = {
        ...prev,
        ...defaults,
        forcedHighContrastOverride: false,
        sessionMusicMuted: false,
      };
      applySettingsToDocument(nextState);
      set({
        ...defaults,
        forcedHighContrastOverride: false,
        sessionMusicMuted: false,
      });
    },

    setSystemPreferences: (prefs) =>
      set((state) => {
        const next = {
          ...state,
          systemReducedMotion:
            prefs.reducedMotion !== undefined
              ? prefs.reducedMotion
              : state.systemReducedMotion,
          systemHighContrast:
            prefs.highContrast !== undefined
              ? prefs.highContrast
              : state.systemHighContrast,
        };
        applySettingsToDocument(next);
        return {
          systemReducedMotion: next.systemReducedMotion,
          systemHighContrast: next.systemHighContrast,
        };
      }),
  };
});

export function selectResolvedMotion(state: Pick<SettingsStoreState, 'motion' | 'systemReducedMotion'>): 'reduced' | 'full' {
  return resolveMotion(state.motion, state.systemReducedMotion);
}

export function selectResolvedContrast(
  state: Pick<SettingsStoreState, 'contrast' | 'systemHighContrast' | 'forcedHighContrastOverride'>
): 'normal' | 'high' {
  return resolveContrast(
    state.contrast,
    state.systemHighContrast,
    state.forcedHighContrastOverride
  );
}

export function initSettingsDomSync(): () => void {
  const current = useSettingsStore.getState();
  applySettingsToDocument(current);

  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => undefined;
  }

  const cleanups: Array<() => void> = [];

  try {
    const motionMql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastMql = window.matchMedia('(prefers-contrast: more)');

    useSettingsStore.getState().setSystemPreferences({
      reducedMotion: motionMql.matches,
      highContrast: contrastMql.matches,
    });

    const onMotionChange = (event: MediaQueryListEvent) => {
      useSettingsStore.getState().setSystemPreferences({ reducedMotion: event.matches });
    };
    const onContrastChange = (event: MediaQueryListEvent) => {
      useSettingsStore.getState().setSystemPreferences({ highContrast: event.matches });
    };

    if (typeof motionMql.addEventListener === 'function') {
      motionMql.addEventListener('change', onMotionChange);
      contrastMql.addEventListener('change', onContrastChange);
      cleanups.push(() => {
        motionMql.removeEventListener('change', onMotionChange);
        contrastMql.removeEventListener('change', onContrastChange);
      });
    }
  } catch {
    // Ignore matchMedia errors
  }

  return () => {
    cleanups.forEach((fn) => fn());
  };
}
