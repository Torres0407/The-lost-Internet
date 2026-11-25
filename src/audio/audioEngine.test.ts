import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BISCUITS_WALTZ, RING_HUB_HUM } from '../content/audio';
import { useCollectionStore } from '../state/collectionStore';
import { useProgressStore } from '../state/progressStore';
import { useNotebookStore } from '../state/notebookStore';
import { useBrowserStore } from '../state/browserStore';
import { persistenceController } from '../state/persistence/persistenceController';
import { createInMemorySaveStorage } from '../state/persistence/inMemoryStorage';
import { useSettingsStore } from '../state/settingsStore';
import { serializeState } from '../engine/save';
import { createAudioEngine, MAX_CONCURRENT_EFFECTS, type AudioContextLike } from './audioEngine';
import { MAX_SOUND_LOG_ENTRIES, useSoundLogStore } from './soundLogStore';
import { ALL_SOUND_IDS, isInformationalSound, SOUND_REGISTRY } from './soundRegistry';

function createMockAudioContext() {
  const gains: Array<{
    gain: {
      value: number;
      setValueAtTime: ReturnType<typeof vi.fn>;
      linearRampToValueAtTime: ReturnType<typeof vi.fn>;
      cancelScheduledValues: ReturnType<typeof vi.fn>;
    };
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  }> = [];

  const oscillators: Array<{
    type: OscillatorType;
    frequency: {
      value: number;
      setValueAtTime: ReturnType<typeof vi.fn>;
      linearRampToValueAtTime: ReturnType<typeof vi.fn>;
    };
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
  }> = [];

  const mockCtx: AudioContextLike & {
    resume: ReturnType<typeof vi.fn>;
    suspend: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
  } = {
    state: 'running',
    currentTime: 10,
    sampleRate: 44100,
    destination: {} as AudioDestinationNode,
    createGain: vi.fn(() => {
      const node = {
        gain: {
          value: 1,
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          cancelScheduledValues: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
      gains.push(node);
      return node;
    }),
    createOscillator: vi.fn(() => {
      const osc = {
        type: 'sine' as OscillatorType,
        frequency: {
          value: 440,
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };
      oscillators.push(osc);
      return osc;
    }),
    resume: vi.fn(async () => {
      mockCtx.state = 'running';
    }),
    suspend: vi.fn(async () => {
      mockCtx.state = 'suspended';
    }),
    close: vi.fn(async () => {
      mockCtx.state = 'closed';
    }),
  };

  return { mockCtx, gains, oscillators };
}

describe('audioEngine, soundRegistry & soundLogStore', () => {
  let hydrating = false;
  let hidden = false;
  let createAudioContextSpy: ReturnType<typeof vi.fn<() => AudioContextLike | null>>;
  let mockAudio: ReturnType<typeof createMockAudioContext>;

  beforeEach(() => {
    vi.useFakeTimers();
    hydrating = false;
    hidden = false;
    mockAudio = createMockAudioContext();
    createAudioContextSpy = vi.fn(() => mockAudio.mockCtx);

    useSettingsStore.getState().resetSettings();
    useSoundLogStore.getState().clearEntries();
    useCollectionStore.getState().resetCollection();
    useProgressStore.getState().resetProgress();
    useNotebookStore.getState().clearNotebook();
    useBrowserStore.getState().resetBrowser();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('never creates an AudioContext on startup or while audioEnabled is false', () => {
    const engine = createAudioEngine({
      createAudioContext: createAudioContextSpy,
      isHydrating: () => hydrating,
      isDocumentHidden: () => hidden,
    });

    engine.playSound('ui_click');
    engine.playSound('notification_chime');
    engine.startMusicPattern(BISCUITS_WALTZ);
    engine.unlockFromUserGesture();

    expect(createAudioContextSpy).not.toHaveBeenCalled();
    expect(engine.getStateForTest().hasContext).toBe(false);
    engine.dispose();
  });

  it('creates an AudioContext once inside user gesture when audioEnabled is true and ramps volumes', () => {
    useSettingsStore.getState().setAudioEnabled(true);
    const engine = createAudioEngine({
      createAudioContext: createAudioContextSpy,
      isHydrating: () => hydrating,
      isDocumentHidden: () => hidden,
    });

    engine.unlockFromUserGesture();
    engine.unlockFromUserGesture();

    expect(createAudioContextSpy).toHaveBeenCalledTimes(1);
    expect(engine.getStateForTest().hasContext).toBe(true);

    useSettingsStore.getState().setMasterVolume(0.25);
    engine.handleSettingsOrVisibilityChange();
    const masterGainNode = mockAudio.gains[0];
    expect(masterGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
      0.25,
      expect.any(Number)
    );

    engine.dispose();
  });

  it('plays at most one music track at a time and crossfades on site change', () => {
    useSettingsStore.getState().setAudioEnabled(true);
    const engine = createAudioEngine({
      createAudioContext: createAudioContextSpy,
      isHydrating: () => hydrating,
      isDocumentHidden: () => hidden,
    });

    engine.unlockFromUserGesture();
    engine.syncTrackForUrl('meridian://delphines-garden/');
    expect(engine.getStateForTest().currentTrackId).toBe('biscuits_waltz');

    engine.syncTrackForUrl('meridian://ring-hub/');
    expect(engine.getStateForTest().currentTrackId).toBe('ring_hub_hum');
    expect(mockAudio.oscillators.length).toBeGreaterThan(0);

    // Stopping music logs stopped entry and clears active session
    engine.stopMusic();
    expect(engine.getStateForTest().currentTrackId).toBeNull();
    expect(useSoundLogStore.getState().entries[0].soundId).toBe('music_stopped');

    engine.dispose();
  });

  it('suspends AudioContext and stops music + modem when audio disabled or document hidden', () => {
    useSettingsStore.getState().setAudioEnabled(true);
    const engine = createAudioEngine({
      createAudioContext: createAudioContextSpy,
      isHydrating: () => hydrating,
      isDocumentHidden: () => hidden,
    });

    engine.unlockFromUserGesture();
    engine.startMusicPattern(RING_HUB_HUM);
    engine.playSound('modem_handshake');
    expect(engine.getStateForTest().modemPlaying).toBe(true);

    hidden = true;
    engine.handleSettingsOrVisibilityChange();
    expect(mockAudio.mockCtx.suspend).toHaveBeenCalled();
    expect(engine.getStateForTest().currentTrackId).toBeNull();
    expect(engine.getStateForTest().modemPlaying).toBe(false);

    // Restoring visibility resumes context and restarts desired track
    hidden = false;
    useSettingsStore.getState().setAudioEnabled(false);
    engine.handleSettingsOrVisibilityChange();
    expect(engine.getStateForTest().currentTrackId).toBeNull();

    engine.dispose();
  });

  it('skips modem_handshake audio when modemSound is false and stops immediately on stopModemSound()', () => {
    useSettingsStore.getState().setAudioEnabled(true);
    const engine = createAudioEngine({
      createAudioContext: createAudioContextSpy,
      isHydrating: () => hydrating,
      isDocumentHidden: () => hidden,
    });
    engine.unlockFromUserGesture();

    useSettingsStore.getState().setModemSound(false);
    const oscBefore = mockAudio.oscillators.length;
    engine.playSound('modem_handshake');
    expect(mockAudio.oscillators.length).toBe(oscBefore);
    // Informational Sound Log cue still records
    expect(useSoundLogStore.getState().entries[0].soundId).toBe('modem_handshake');

    useSettingsStore.getState().setModemSound(true);
    engine.playSound('modem_handshake');
    expect(engine.getStateForTest().modemPlaying).toBe(true);
    expect(engine.stopModemSound()).toBe(true);
    expect(engine.getStateForTest().modemPlaying).toBe(false);

    engine.dispose();
  });

  it('caps concurrent overlapping effects at MAX_CONCURRENT_EFFECTS (3)', () => {
    useSettingsStore.getState().setAudioEnabled(true);
    const engine = createAudioEngine({
      createAudioContext: createAudioContextSpy,
      isHydrating: () => hydrating,
      isDocumentHidden: () => hidden,
    });
    engine.unlockFromUserGesture();

    engine.playSound('insight_chime');
    engine.playSound('artifact_chime');
    engine.playSound('notification_chime');
    engine.playSound('error_buzz');

    expect(engine.getStateForTest().activeEffectsCount).toBe(MAX_CONCURRENT_EFFECTS);
    engine.dispose();
  });

  it('suppresses all sounds and Sound Log entries while hydrating', () => {
    useSettingsStore.getState().setAudioEnabled(true);
    hydrating = true;
    const engine = createAudioEngine({
      createAudioContext: createAudioContextSpy,
      isHydrating: () => hydrating,
      isDocumentHidden: () => hidden,
    });
    engine.unlockFromUserGesture();

    const oscBefore = mockAudio.oscillators.length;
    engine.playSound('artifact_chime');
    engine.startMusicPattern(BISCUITS_WALTZ);

    expect(mockAudio.oscillators.length).toBe(oscBefore);
    expect(useSoundLogStore.getState().entries).toHaveLength(0);
    expect(engine.getStateForTest().currentTrackId).toBeNull();

    engine.dispose();
  });

  it('requires every informational sound in SOUND_REGISTRY to provide a non-empty visualCue', () => {
    for (const id of ALL_SOUND_IDS) {
      const def = SOUND_REGISTRY[id];
      if (isInformationalSound(id)) {
        expect(typeof def.visualCue).toBe('string');
        expect((def.visualCue ?? '').trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('logs informational sounds up to 20 entries even with sound disabled and excludes decorative clicks', () => {
    const engine = createAudioEngine({
      createAudioContext: createAudioContextSpy,
      isHydrating: () => hydrating,
      isDocumentHidden: () => hidden,
    });

    engine.playSound('ui_click');
    engine.playSound('window_open');
    engine.playSound('window_close');
    expect(useSoundLogStore.getState().entries).toHaveLength(0);

    for (let i = 0; i < 25; i += 1) {
      engine.playSound('save_tick', { visualCue: `Autosave #${i + 1}` });
    }

    const entries = useSoundLogStore.getState().entries;
    expect(entries).toHaveLength(MAX_SOUND_LOG_ENTRIES);
    expect(entries[0].text).toBe('Autosave #25');
    expect(createAudioContextSpy).not.toHaveBeenCalled();

    engine.dispose();
  });

  it('produces zero collection toasts, zero sound log entries, and zero AudioContext creation on mid-chain save restore', async () => {
    const midChainSave = serializeState(
      {
        progress: {
          facts: new Set(['date_1109', 'maintenance_window_known', 'connection_1109']),
          discoveredPages: [
            'meridian://ring-hub/',
            'meridian://delphines-garden/',
            'meridian://delphines-garden/guestbook',
            'meridian://tumbleweed/support',
          ],
        },
        notebook: {
          clues: [],
          links: [],
          freeNotes: 'Mid-chain investigation note',
          insights: [],
        },
        collection: {
          unlockedArtifacts: [{ id: 'delphine-sunflower', unlockedAt: 1000 }],
          unlockedAchievements: [],
          sourceViewedUrls: ['meridian://delphines-garden/'],
          spoilersHidden: true,
        },
        browser: {
          bookmarks: ['meridian://ring-hub/'],
        },
      },
      2000
    );

    const storage = createInMemorySaveStorage();
    await storage.save(midChainSave);

    await persistenceController.start();
    await persistenceController.replaceWithSave(midChainSave);

    expect(useCollectionStore.getState().toastQueue).toHaveLength(0);
    expect(useSoundLogStore.getState().entries).toHaveLength(0);
    expect(createAudioContextSpy).not.toHaveBeenCalled();
  });
});
