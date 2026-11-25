import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clamp01,
  createDefaultSettings,
  parseSettings,
  resolveContrast,
  resolveMotion,
  serializeSettings,
  SETTINGS_STORAGE_KEY,
  SETTINGS_VERSION,
  validateSettings,
} from './settings';
import { CURRENT_SAVE_VERSION, serializeState } from './save';
import {
  useSettingsStore,
  writeSettingsToStorage,
} from '../state/settingsStore';

function installMockLocalStorage(initial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initial));
  const mockStorage = {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => store.clear()),
    key: vi.fn((idx: number) => Array.from(store.keys())[idx] ?? null),
    get length() {
      return store.size;
    },
  };
  return { store, mockStorage };
}

describe('settings engine', () => {
  beforeEach(() => {
    useSettingsStore.getState().resetSettings();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates default settings matching spec with audio disabled until boot choice', () => {
    const defaults = createDefaultSettings();
    expect(defaults).toEqual({
      version: SETTINGS_VERSION,
      audioEnabled: false,
      audioChoiceMade: false,
      masterVolume: 0.7,
      musicVolume: 0.6,
      effectsVolume: 0.8,
      modemSound: true,
      soundLogVisible: true,
      textScale: 100,
      contrast: 'normal',
      motion: 'system',
      scanlines: false,
      glitchEffects: true,
    });
  });

  it('clamps volumes into [0, 1] and falls back for non-finite values', () => {
    expect(clamp01(-0.5, 0.7)).toBe(0);
    expect(clamp01(1.8, 0.7)).toBe(1);
    expect(clamp01(0.35, 0.7)).toBe(0.35);
    expect(clamp01(Number.NaN, 0.7)).toBe(0.7);
    expect(clamp01(Number.POSITIVE_INFINITY, 0.6)).toBe(0.6);
    expect(clamp01('0.5', 0.8)).toBe(0.8);
  });

  it('validates partial objects cleanly and repairs invalid enums/types', () => {
    const validated = validateSettings({
      audioEnabled: true,
      masterVolume: 4,
      musicVolume: -1,
      textScale: 200,
      contrast: 'mega',
      motion: 'warp',
      scanlines: 'yes',
      glitchEffects: false,
    });

    expect(validated).toEqual({
      version: 1,
      audioEnabled: true,
      audioChoiceMade: false,
      masterVolume: 1,
      musicVolume: 0,
      effectsVolume: 0.8,
      modemSound: true,
      soundLogVisible: true,
      textScale: 100,
      contrast: 'normal',
      motion: 'system',
      scanlines: false,
      glitchEffects: false,
    });
  });

  it('handles corrupt JSON and non-object inputs gracefully', () => {
    expect(parseSettings(null)).toEqual(createDefaultSettings());
    expect(parseSettings('')).toEqual(createDefaultSettings());
    expect(parseSettings('{not-json')).toEqual(createDefaultSettings());
    expect(parseSettings('[1, 2, 3]')).toEqual(createDefaultSettings());
    expect(parseSettings('42')).toEqual(createDefaultSettings());
  });

  it('serializes and parses valid settings under 2 KB', () => {
    const custom = {
      ...createDefaultSettings(),
      audioEnabled: true,
      audioChoiceMade: true,
      textScale: 150 as const,
      contrast: 'high' as const,
      motion: 'reduce' as const,
      scanlines: true,
      glitchEffects: false,
    };

    const json = serializeSettings(custom);
    expect(json.length).toBeLessThan(2048);
    expect(parseSettings(json)).toEqual(custom);
  });

  it('persists settings to localStorage under "tli:settings" and tolerates storage errors', () => {
    const { store, mockStorage } = installMockLocalStorage();
    vi.stubGlobal('window', { localStorage: mockStorage });

    const custom = { ...createDefaultSettings(), textScale: 125 as const, audioEnabled: true };
    writeSettingsToStorage(custom);

    expect(mockStorage.setItem).toHaveBeenCalledTimes(1);
    expect(mockStorage.setItem.mock.calls[0][0]).toBe(SETTINGS_STORAGE_KEY);
    expect(parseSettings(store.get(SETTINGS_STORAGE_KEY))).toEqual(custom);

    mockStorage.setItem.mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => writeSettingsToStorage(custom)).not.toThrow();
  });

  it('keeps settings completely separate from exported game SaveData', () => {
    const save = serializeState(
      {
        progress: { facts: new Set(['date_1109']), discoveredPages: ['meridian://ring-hub/'] },
        notebook: { clues: [], links: [], freeNotes: '', insights: [] },
        collection: {
          unlockedArtifacts: [],
          unlockedAchievements: [],
          sourceViewedUrls: [],
          spoilersHidden: true,
        },
        browser: { bookmarks: ['meridian://ring-hub/'] },
      },
      12345
    );

    expect(save.saveVersion).toBe(CURRENT_SAVE_VERSION);
    expect('settings' in save).toBe(false);
    expect(Object.keys(save).sort()).toEqual([
      'browser',
      'collection',
      'notebook',
      'progress',
      'saveVersion',
      'savedAt',
    ]);
  });

  it('resolves motion and contrast across system preferences and user overrides', () => {
    expect(resolveMotion('system', false)).toBe('full');
    expect(resolveMotion('system', true)).toBe('reduced');
    expect(resolveMotion('reduce', false)).toBe('reduced');
    expect(resolveMotion('full', true)).toBe('full');

    expect(resolveContrast('normal', false, false)).toBe('normal');
    expect(resolveContrast('normal', true, false)).toBe('high');
    expect(resolveContrast('high', false, false)).toBe('high');
    expect(resolveContrast('normal', false, true)).toBe('high');
  });
});
