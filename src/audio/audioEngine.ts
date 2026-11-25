import { getTrackForUrl } from '../content/audio';
import { getStepDurationSeconds, scheduleSteps, type Pattern } from '../engine/music';
import { emitShellEvent } from '../events/eventBus';
import { useCollectionStore } from '../state/collectionStore';
import { useSettingsStore } from '../state/settingsStore';
import { useSoundLogStore } from './soundLogStore';
import { ALL_SOUND_IDS, SOUND_REGISTRY, type SoundId } from './soundRegistry';

export const AUDIO_GAIN_RAMP_SECONDS = 0.03;
export const MUSIC_STOP_FADE_SECONDS = 0.15;
export const MUSIC_CROSSFADE_SECONDS = 0.3;
export const LOOKAHEAD_MS = 25;
export const SCHEDULE_AHEAD_SECONDS = 0.1;
export const MAX_CONCURRENT_EFFECTS = 3;
export const MODEM_DURATION_SECONDS = 2.5;

export interface AudioParamLike {
  value: number;
  setValueAtTime?: (value: number, startTime: number) => void;
  linearRampToValueAtTime?: (value: number, endTime: number) => void;
  exponentialRampToValueAtTime?: (value: number, endTime: number) => void;
  cancelScheduledValues?: (cancelTime: number) => void;
}

export interface GainNodeLike {
  gain: AudioParamLike;
  connect: (destination: AudioNodeLike) => void;
  disconnect: () => void;
}

export interface OscillatorNodeLike {
  type: OscillatorType;
  frequency: AudioParamLike;
  connect: (destination: AudioNodeLike) => void;
  disconnect: () => void;
  start: (when?: number) => void;
  stop: (when?: number) => void;
}

export interface AudioBufferSourceNodeLike {
  buffer: AudioBuffer | null;
  connect: (destination: AudioNodeLike) => void;
  disconnect: () => void;
  start: (when?: number) => void;
  stop: (when?: number) => void;
}

export interface BiquadFilterNodeLike {
  type: BiquadFilterType;
  frequency: AudioParamLike;
  Q: AudioParamLike;
  connect: (destination: AudioNodeLike) => void;
  disconnect: () => void;
}

export type AudioNodeLike =
  | GainNodeLike
  | OscillatorNodeLike
  | AudioBufferSourceNodeLike
  | BiquadFilterNodeLike
  | AudioDestinationNode;

export interface AudioContextLike {
  state: AudioContextState;
  currentTime: number;
  sampleRate: number;
  destination: AudioDestinationNode;
  createGain: () => GainNodeLike;
  createOscillator: () => OscillatorNodeLike;
  createBufferSource?: () => AudioBufferSourceNodeLike;
  createBiquadFilter?: () => BiquadFilterNodeLike;
  createBuffer?: (
    numberOfChannels: number,
    length: number,
    sampleRate: number
  ) => AudioBuffer;
  resume: () => Promise<void>;
  suspend: () => Promise<void>;
  close?: () => Promise<void>;
}

export interface PlaySoundOptions {
  visualCue?: string;
  forceLogOnly?: boolean;
}

export interface AudioEngineDependencies {
  createAudioContext?: () => AudioContextLike | null;
  isHydrating?: () => boolean;
  isDocumentHidden?: () => boolean;
  setTimer?: typeof setInterval;
  clearTimer?: typeof clearInterval;
  setDelay?: typeof setTimeout;
  clearDelay?: typeof clearTimeout;
  announce?: (message: string) => void;
}

interface ActiveEffectVoice {
  id: number;
  soundId: SoundId;
  endTime: number;
  stop: () => void;
}

interface TrackPlaybackSession {
  pattern: Pattern;
  busGain: GainNodeLike;
  nextStepIndex: number;
  nextNoteTime: number;
  timerId: ReturnType<typeof setInterval> | null;
  stopping: boolean;
}

function defaultCreateAudioContext(): AudioContextLike | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (typeof ctor !== 'function') {
    return null;
  }
  try {
    return new ctor() as unknown as AudioContextLike;
  } catch {
    return null;
  }
}

function rampParam(param: AudioParamLike, targetValue: number, now: number, durationSec: number): void {
  const safeTarget = Math.max(0, Math.min(1, targetValue));
  if (typeof param.cancelScheduledValues === 'function') {
    param.cancelScheduledValues(now);
  }
  if (typeof param.setValueAtTime === 'function') {
    param.setValueAtTime(param.value, now);
  }
  if (typeof param.linearRampToValueAtTime === 'function') {
    param.linearRampToValueAtTime(safeTarget, now + durationSec);
  } else {
    param.value = safeTarget;
  }
}

export function createAudioEngine(deps: AudioEngineDependencies = {}) {
  const createCtx = deps.createAudioContext ?? defaultCreateAudioContext;
  const isHydrating =
    deps.isHydrating ?? (() => useCollectionStore.getState().hydrating);
  const isDocumentHidden =
    deps.isDocumentHidden ??
    (() => (typeof document !== 'undefined' ? document.hidden : false));
  const setTimerFn = deps.setTimer ?? setInterval;
  const clearTimerFn = deps.clearTimer ?? clearInterval;
  const setDelayFn = deps.setDelay ?? setTimeout;
  const clearDelayFn = deps.clearDelay ?? clearTimeout;
  const announceFn =
    deps.announce ??
    ((message: string) => emitShellEvent({ type: 'os/announce', message }));

  let ctx: AudioContextLike | null = null;
  let masterGain: GainNodeLike | null = null;
  let musicGain: GainNodeLike | null = null;
  let effectsGain: GainNodeLike | null = null;
  let hasUserGesture = false;

  let activeEffects: ActiveEffectVoice[] = [];
  let nextEffectVoiceId = 1;
  let activeModemVoice: ActiveEffectVoice | null = null;

  let currentMusicSession: TrackPlaybackSession | null = null;
  let desiredPattern: Pattern | null = null;
  let pendingPlayAllTimers: Array<ReturnType<typeof setTimeout>> = [];
  const cleanupTimers: Array<ReturnType<typeof setTimeout>> = [];

  const canPlayAudio = (): boolean => {
    const settings = useSettingsStore.getState();
    return settings.audioEnabled && hasUserGesture && !isDocumentHidden();
  };

  const canPlayMusic = (): boolean => {
    const settings = useSettingsStore.getState();
    return canPlayAudio() && !settings.sessionMusicMuted;
  };

  const ensureContext = (): AudioContextLike | null => {
    if (!hasUserGesture || !useSettingsStore.getState().audioEnabled) {
      return null;
    }
    if (!ctx) {
      ctx = createCtx();
      if (!ctx) {
        return null;
      }
      masterGain = ctx.createGain();
      musicGain = ctx.createGain();
      effectsGain = ctx.createGain();

      const settings = useSettingsStore.getState();
      masterGain.gain.value = settings.audioEnabled ? settings.masterVolume : 0;
      musicGain.gain.value = settings.sessionMusicMuted ? 0 : settings.musicVolume;
      effectsGain.gain.value = settings.effectsVolume;

      musicGain.connect(masterGain);
      effectsGain.connect(masterGain);
      masterGain.connect(ctx.destination);
    }
    return ctx;
  };

  const syncGainLevels = () => {
    if (!ctx || !masterGain || !musicGain || !effectsGain) {
      return;
    }
    const settings = useSettingsStore.getState();
    const now = ctx.currentTime;
    const effectiveMaster =
      settings.audioEnabled && !isDocumentHidden() ? settings.masterVolume : 0;
    const effectiveMusic =
      settings.audioEnabled && !settings.sessionMusicMuted ? settings.musicVolume : 0;

    rampParam(masterGain.gain, effectiveMaster, now, AUDIO_GAIN_RAMP_SECONDS);
    rampParam(musicGain.gain, effectiveMusic, now, AUDIO_GAIN_RAMP_SECONDS);
    rampParam(effectsGain.gain, settings.effectsVolume, now, AUDIO_GAIN_RAMP_SECONDS);
  };

  const syncContextPowerState = () => {
    if (!ctx) {
      return;
    }
    if (canPlayAudio()) {
      if (ctx.state === 'suspended') {
        void ctx.resume().catch(() => undefined);
      }
      syncGainLevels();
    } else {
      syncGainLevels();
      if (ctx.state === 'running') {
        void ctx.suspend().catch(() => undefined);
      }
    }
  };

  const pruneFinishedEffects = (now: number) => {
    activeEffects = activeEffects.filter((voice) => voice.endTime > now);
  };

  const registerEffectVoice = (soundId: SoundId, endTime: number, stop: () => void): void => {
    const now = ctx?.currentTime ?? 0;
    pruneFinishedEffects(now);

    while (activeEffects.length >= MAX_CONCURRENT_EFFECTS) {
      const oldest = activeEffects.shift();
      if (oldest) {
        try {
          oldest.stop();
        } catch {
          // Ignore node stop errors
        }
        if (activeModemVoice?.id === oldest.id) {
          activeModemVoice = null;
        }
      }
    }

    const voice: ActiveEffectVoice = {
      id: nextEffectVoiceId,
      soundId,
      endTime,
      stop,
    };
    nextEffectVoiceId += 1;
    activeEffects.push(voice);
    if (soundId === 'modem_handshake') {
      activeModemVoice = voice;
    }
  };

  const stopModemSound = (): boolean => {
    if (!activeModemVoice) {
      return false;
    }
    const modem = activeModemVoice;
    activeModemVoice = null;
    activeEffects = activeEffects.filter((v) => v.id !== modem.id);
    try {
      modem.stop();
    } catch {
      // Ignore
    }
    return true;
  };

  const synthesizeToneSequence = (
    soundId: SoundId,
    steps: ReadonlyArray<{
      delay: number;
      duration: number;
      freq: number;
      endFreq?: number;
      waveform: OscillatorType;
      gain: number;
    }>
  ) => {
    if (!ctx || !effectsGain) {
      return;
    }
    const baseTime = ctx.currentTime;
    const nodes: Array<{ stop: () => void; disconnect: () => void }> = [];
    const voiceBus = ctx.createGain();
    voiceBus.gain.value = 1;
    voiceBus.connect(effectsGain);

    let maxEndTime = baseTime;

    for (const step of steps) {
      const startTime = baseTime + step.delay;
      const endTime = startTime + step.duration;
      if (endTime > maxEndTime) {
        maxEndTime = endTime;
      }

      const osc = ctx.createOscillator();
      const stepGain = ctx.createGain();
      osc.type = step.waveform;
      osc.frequency.value = step.freq;
      if (step.endFreq && typeof osc.frequency.linearRampToValueAtTime === 'function') {
        osc.frequency.setValueAtTime?.(step.freq, startTime);
        osc.frequency.linearRampToValueAtTime(step.endFreq, endTime);
      }

      stepGain.gain.value = 0.0001;
      stepGain.gain.setValueAtTime?.(0.0001, startTime);
      stepGain.gain.linearRampToValueAtTime?.(step.gain, startTime + 0.008);
      stepGain.gain.linearRampToValueAtTime?.(0.0001, endTime);

      osc.connect(stepGain);
      stepGain.connect(voiceBus);
      osc.start(startTime);
      osc.stop(endTime + 0.01);

      nodes.push({
        stop: () => {
          try {
            osc.stop(ctx?.currentTime ?? 0);
          } catch {
            // Ignore double stop
          }
        },
        disconnect: () => {
          osc.disconnect();
          stepGain.disconnect();
        },
      });
    }

    registerEffectVoice(soundId, maxEndTime + 0.02, () => {
      for (const n of nodes) {
        n.stop();
        n.disconnect();
      }
      voiceBus.disconnect();
    });
  };

  const synthesizeModemHandshake = () => {
    if (!ctx || !effectsGain) {
      return;
    }
    const baseTime = ctx.currentTime;
    const nodes: Array<{ stop: () => void; disconnect: () => void }> = [];
    const modemBus = ctx.createGain();
    modemBus.gain.value = 0.35;
    modemBus.connect(effectsGain);

    const scheduleTone = (
      delay: number,
      duration: number,
      freq: number,
      waveform: OscillatorType,
      gain: number,
      endFreq?: number
    ) => {
      if (!ctx) {
        return;
      }
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const start = baseTime + delay;
      const end = start + duration;
      osc.type = waveform;
      osc.frequency.value = freq;
      if (endFreq && typeof osc.frequency.linearRampToValueAtTime === 'function') {
        osc.frequency.setValueAtTime?.(freq, start);
        osc.frequency.linearRampToValueAtTime(endFreq, end);
      }
      g.gain.value = 0.0001;
      g.gain.setValueAtTime?.(0.0001, start);
      g.gain.linearRampToValueAtTime?.(gain, start + 0.01);
      g.gain.linearRampToValueAtTime?.(0.0001, end);

      osc.connect(g);
      g.connect(modemBus);
      osc.start(start);
      osc.stop(end + 0.01);

      nodes.push({
        stop: () => {
          try {
            osc.stop(ctx?.currentTime ?? 0);
          } catch {
            // Ignore
          }
        },
        disconnect: () => {
          osc.disconnect();
          g.disconnect();
        },
      });
    };

    // 1) Dial tone (0.0 - 0.32s)
    scheduleTone(0, 0.32, 350, 'sine', 0.25);
    scheduleTone(0, 0.32, 440, 'sine', 0.25);

    // 2) Fast DTMF digits (0.36 - 0.85s)
    const dtmfPairs: Array<[number, number]> = [
      [697, 1209],
      [770, 1336],
      [852, 1477],
      [697, 1477],
      [770, 1209],
    ];
    dtmfPairs.forEach(([low, high], idx) => {
      const start = 0.36 + idx * 0.1;
      scheduleTone(start, 0.075, low, 'sine', 0.24);
      scheduleTone(start, 0.075, high, 'sine', 0.24);
    });

    // 3) Answer tone & carrier screech sweep (0.95 - 1.75s)
    scheduleTone(0.95, 0.28, 2100, 'sine', 0.3);
    scheduleTone(1.25, 0.48, 1200, 'square', 0.18, 2400);
    scheduleTone(1.28, 0.45, 2400, 'triangle', 0.16, 980);

    // 4) Handshake noise burst (1.75 - 2.5s) if AudioBuffer is available
    if (
      typeof ctx.createBuffer === 'function' &&
      typeof ctx.createBufferSource === 'function'
    ) {
      const duration = MODEM_DURATION_SECONDS - 1.75;
      const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
      const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
      if (typeof buffer.getChannelData === 'function') {
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i += 1) {
          data[i] = (Math.random() * 2 - 1) * 0.45;
        }
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const noiseGain = ctx.createGain();
      const start = baseTime + 1.75;
      const end = baseTime + MODEM_DURATION_SECONDS;
      noiseGain.gain.value = 0.22;
      noiseGain.gain.setValueAtTime?.(0.22, start);
      noiseGain.gain.linearRampToValueAtTime?.(0.0001, end);

      if (typeof ctx.createBiquadFilter === 'function') {
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1800;
        filter.Q.value = 2.2;
        source.connect(filter);
        filter.connect(noiseGain);
      } else {
        source.connect(noiseGain);
      }

      noiseGain.connect(modemBus);
      source.start(start);
      source.stop(end);
      nodes.push({
        stop: () => {
          try {
            source.stop(ctx?.currentTime ?? 0);
          } catch {
            // Ignore
          }
        },
        disconnect: () => {
          source.disconnect();
          noiseGain.disconnect();
        },
      });
    } else {
      scheduleTone(1.75, 0.72, 1650, 'sawtooth', 0.12, 1950);
    }

    registerEffectVoice('modem_handshake', baseTime + MODEM_DURATION_SECONDS + 0.05, () => {
      for (const n of nodes) {
        n.stop();
        n.disconnect();
      }
      modemBus.disconnect();
    });
  };

  const renderWebAudioEffect = (id: SoundId) => {
    if (!canPlayAudio()) {
      return;
    }
    const activeCtx = ensureContext();
    if (!activeCtx || !effectsGain) {
      return;
    }
    syncContextPowerState();

    switch (id) {
      case 'ui_click':
        synthesizeToneSequence(id, [
          { delay: 0, duration: 0.032, freq: 920, waveform: 'triangle', gain: 0.14 },
        ]);
        break;
      case 'window_open':
        synthesizeToneSequence(id, [
          { delay: 0, duration: 0.06, freq: 523.25, waveform: 'triangle', gain: 0.18 },
          { delay: 0.055, duration: 0.09, freq: 659.25, waveform: 'triangle', gain: 0.18 },
        ]);
        break;
      case 'window_close':
        synthesizeToneSequence(id, [
          { delay: 0, duration: 0.055, freq: 659.25, waveform: 'triangle', gain: 0.16 },
          { delay: 0.05, duration: 0.08, freq: 493.88, waveform: 'triangle', gain: 0.16 },
        ]);
        break;
      case 'notification_chime':
        synthesizeToneSequence(id, [
          { delay: 0, duration: 0.09, freq: 783.99, waveform: 'sine', gain: 0.22 },
          { delay: 0.085, duration: 0.15, freq: 987.77, waveform: 'sine', gain: 0.22 },
        ]);
        break;
      case 'insight_chime':
        synthesizeToneSequence(id, [
          { delay: 0, duration: 0.1, freq: 523.25, waveform: 'triangle', gain: 0.22 },
          { delay: 0.09, duration: 0.1, freq: 659.25, waveform: 'triangle', gain: 0.22 },
          { delay: 0.18, duration: 0.2, freq: 783.99, waveform: 'sine', gain: 0.24 },
        ]);
        break;
      case 'artifact_chime':
        synthesizeToneSequence(id, [
          { delay: 0, duration: 0.11, freq: 392.0, waveform: 'triangle', gain: 0.22 },
          { delay: 0.09, duration: 0.11, freq: 493.88, waveform: 'triangle', gain: 0.22 },
          { delay: 0.18, duration: 0.11, freq: 587.33, waveform: 'triangle', gain: 0.22 },
          { delay: 0.27, duration: 0.26, freq: 783.99, waveform: 'sine', gain: 0.25 },
        ]);
        break;
      case 'error_buzz':
        synthesizeToneSequence(id, [
          {
            delay: 0,
            duration: 0.19,
            freq: 175,
            endFreq: 132,
            waveform: 'sawtooth',
            gain: 0.16,
          },
        ]);
        break;
      case 'save_tick':
        synthesizeToneSequence(id, [
          { delay: 0, duration: 0.025, freq: 1380, waveform: 'square', gain: 0.09 },
          { delay: 0.025, duration: 0.025, freq: 980, waveform: 'triangle', gain: 0.09 },
        ]);
        break;
      case 'modem_handshake':
        synthesizeModemHandshake();
        break;
      case 'music_started':
        synthesizeToneSequence(id, [
          { delay: 0, duration: 0.08, freq: 523.25, waveform: 'sine', gain: 0.12 },
        ]);
        break;
      case 'music_stopped':
        synthesizeToneSequence(id, [
          { delay: 0, duration: 0.08, freq: 392.0, waveform: 'sine', gain: 0.1 },
        ]);
        break;
    }
  };

  const playSound = (id: SoundId, options: PlaySoundOptions = {}): void => {
    if (isHydrating()) {
      return;
    }

    const def = SOUND_REGISTRY[id];
    if (!def) {
      return;
    }

    if (def.category === 'informational') {
      const cueText = (options.visualCue ?? def.visualCue ?? '').trim();
      if (!cueText) {
        throw new Error(`Informational sound "${id}" requires a non-empty visualCue.`);
      }
      useSoundLogStore.getState().recordEntry(id, cueText);
    }

    if (options.forceLogOnly) {
      return;
    }

    if (id === 'modem_handshake' && !useSettingsStore.getState().modemSound) {
      return;
    }

    renderWebAudioEffect(id);
  };

  const scheduleTrackNotesForSession = (session: TrackPlaybackSession) => {
    if (!ctx || session.stopping) {
      return;
    }
    const stepDuration = getStepDurationSeconds(session.pattern);
    const horizon = ctx.currentTime + SCHEDULE_AHEAD_SECONDS;

    while (session.nextNoteTime < horizon) {
      const scheduled = scheduleSteps(session.pattern, session.nextStepIndex, 1);
      for (const note of scheduled) {
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        const noteStart = session.nextNoteTime;
        const noteEnd = noteStart + note.durationSeconds;

        osc.type = note.waveform;
        osc.frequency.value = note.frequency;
        env.gain.value = 0.0001;
        env.gain.setValueAtTime?.(0.0001, noteStart);
        env.gain.linearRampToValueAtTime?.(note.gain, noteStart + 0.015);
        env.gain.linearRampToValueAtTime?.(0.0001, noteEnd);

        osc.connect(env);
        env.connect(session.busGain);
        osc.start(noteStart);
        osc.stop(noteEnd + 0.01);
      }

      session.nextNoteTime += stepDuration;
      session.nextStepIndex =
        (session.nextStepIndex + 1) % session.pattern.totalSteps;
    }
  };

  const fadeOutAndStopSession = (
    session: TrackPlaybackSession,
    fadeSeconds: number
  ) => {
    session.stopping = true;
    if (session.timerId !== null) {
      clearTimerFn(session.timerId);
      session.timerId = null;
    }
    if (ctx) {
      rampParam(session.busGain.gain, 0, ctx.currentTime, fadeSeconds);
    }
    const handle = setDelayFn(() => {
      try {
        session.busGain.disconnect();
      } catch {
        // Ignore disconnect errors
      }
    }, Math.ceil(fadeSeconds * 1000) + 40);
    cleanupTimers.push(handle);
  };

  const stopMusic = (fadeSeconds: number = MUSIC_STOP_FADE_SECONDS): void => {
    desiredPattern = null;
    if (!currentMusicSession) {
      return;
    }
    const prev = currentMusicSession;
    currentMusicSession = null;
    fadeOutAndStopSession(prev, fadeSeconds);
    playSound('music_stopped', {
      visualCue: `Stopped music: ${prev.pattern.title}`,
      forceLogOnly: true,
    });
  };

  const startMusicPattern = (pattern: Pattern): void => {
    desiredPattern = pattern;
    if (!canPlayMusic() || isHydrating()) {
      return;
    }

    const activeCtx = ensureContext();
    if (!activeCtx || !musicGain) {
      return;
    }
    syncContextPowerState();

    if (currentMusicSession && currentMusicSession.pattern.id === pattern.id) {
      return;
    }

    const isCrossfade = currentMusicSession !== null;
    const fadeInDuration = isCrossfade
      ? MUSIC_CROSSFADE_SECONDS
      : AUDIO_GAIN_RAMP_SECONDS;

    if (currentMusicSession) {
      const oldSession = currentMusicSession;
      currentMusicSession = null;
      fadeOutAndStopSession(oldSession, MUSIC_CROSSFADE_SECONDS);
    }

    const busGain = activeCtx.createGain();
    busGain.gain.value = 0;
    busGain.connect(musicGain);
    rampParam(busGain.gain, 1, activeCtx.currentTime, fadeInDuration);

    const session: TrackPlaybackSession = {
      pattern,
      busGain,
      nextStepIndex: 0,
      nextNoteTime: activeCtx.currentTime + 0.02,
      timerId: null,
      stopping: false,
    };

    currentMusicSession = session;
    scheduleTrackNotesForSession(session);
    session.timerId = setTimerFn(() => {
      scheduleTrackNotesForSession(session);
    }, LOOKAHEAD_MS);

    playSound('music_started', {
      visualCue: `Now playing: ${pattern.title}`,
      forceLogOnly: true,
    });
  };

  const syncTrackForUrl = (url: string | null): Pattern | null => {
    if (!url) {
      stopMusic();
      return null;
    }
    const nextTrack = getTrackForUrl(url);
    if (!nextTrack) {
      stopMusic();
      return null;
    }
    desiredPattern = nextTrack;
    if (canPlayMusic() && !isHydrating()) {
      startMusicPattern(nextTrack);
    }
    return nextTrack;
  };

  const unlockFromUserGesture = (): AudioContextLike | null => {
    hasUserGesture = true;
    if (!useSettingsStore.getState().audioEnabled) {
      return null;
    }
    const activeCtx = ensureContext();
    syncContextPowerState();
    if (desiredPattern && canPlayMusic() && !currentMusicSession && !isHydrating()) {
      startMusicPattern(desiredPattern);
    }
    return activeCtx;
  };

  const handleSettingsOrVisibilityChange = () => {
    const settings = useSettingsStore.getState();
    if (!settings.audioEnabled || isDocumentHidden()) {
      stopModemSound();
      if (currentMusicSession) {
        const sessionToStop = currentMusicSession;
        currentMusicSession = null;
        fadeOutAndStopSession(sessionToStop, MUSIC_STOP_FADE_SECONDS);
      }
      syncContextPowerState();
      return;
    }

    syncContextPowerState();

    if (settings.sessionMusicMuted) {
      if (currentMusicSession) {
        const sessionToStop = currentMusicSession;
        currentMusicSession = null;
        fadeOutAndStopSession(sessionToStop, MUSIC_STOP_FADE_SECONDS);
      }
      return;
    }

    if (desiredPattern && hasUserGesture && !currentMusicSession && !isHydrating()) {
      startMusicPattern(desiredPattern);
    }
  };

  const cancelPlayAllSounds = () => {
    for (const timer of pendingPlayAllTimers) {
      clearDelayFn(timer);
    }
    pendingPlayAllTimers = [];
  };

  const playAllSoundsDebug = () => {
    cancelPlayAllSounds();
    if (useSettingsStore.getState().audioEnabled) {
      unlockFromUserGesture();
    }
    const soundList: SoundId[] = ALL_SOUND_IDS.filter(
      (id) => id !== 'music_started' && id !== 'music_stopped'
    );
    soundList.forEach((soundId, idx) => {
      const handle = setDelayFn(() => {
        const def = SOUND_REGISTRY[soundId];
        if (soundId === 'modem_handshake') {
          playSound(soundId, { visualCue: `[Debug test] ${def.label}` });
        } else {
          playSound(soundId, {
            visualCue: def.visualCue
              ? `[Debug test] ${def.visualCue}`
              : `[Debug test] ${def.label}`,
          });
        }
        announceFn(`Played sound: ${def.label}`);
      }, idx * 1000);
      pendingPlayAllTimers.push(handle);
    });
  };

  const dispose = () => {
    cancelPlayAllSounds();
    stopModemSound();
    if (currentMusicSession) {
      const s = currentMusicSession;
      currentMusicSession = null;
      s.stopping = true;
      if (s.timerId !== null) {
        clearTimerFn(s.timerId);
      }
      try {
        s.busGain.disconnect();
      } catch {
        // Ignore
      }
    }
    while (cleanupTimers.length > 0) {
      const t = cleanupTimers.pop();
      if (t !== undefined) {
        clearDelayFn(t);
      }
    }
    for (const voice of activeEffects) {
      try {
        voice.stop();
      } catch {
        // Ignore
      }
    }
    activeEffects = [];
    if (ctx && typeof ctx.close === 'function') {
      void ctx.close().catch(() => undefined);
    }
    ctx = null;
    masterGain = null;
    musicGain = null;
    effectsGain = null;
    desiredPattern = null;
    hasUserGesture = false;
  };

  return {
    unlockFromUserGesture,
    playSound,
    stopModemSound,
    startMusicPattern,
    stopMusic,
    syncTrackForUrl,
    handleSettingsOrVisibilityChange,
    playAllSoundsDebug,
    cancelPlayAllSounds,
    dispose,
    getStateForTest: () => ({
      hasContext: ctx !== null,
      contextState: ctx?.state ?? null,
      hasUserGesture,
      activeEffectsCount: activeEffects.length,
      currentTrackId: currentMusicSession?.pattern.id ?? null,
      desiredTrackId: desiredPattern?.id ?? null,
      modemPlaying: activeModemVoice !== null,
      masterGainValue: masterGain?.gain.value ?? null,
      musicGainValue: musicGain?.gain.value ?? null,
      effectsGainValue: effectsGain?.gain.value ?? null,
    }),
  };
}

export const audioEngine = createAudioEngine();

let wiringAttached = false;

export interface SaveStatusAudioSnapshot {
  status: string;
  bootStage: string;
  errorMessage: string | null;
}

export interface AttachAudioSystemOptions {
  subscribeSaveStatus?: (
    listener: (
      state: SaveStatusAudioSnapshot,
      prev: SaveStatusAudioSnapshot
    ) => void
  ) => () => void;
}

export function attachAudioSystem(options: AttachAudioSystemOptions = {}): () => void {
  if (wiringAttached) {
    return () => undefined;
  }
  wiringAttached = true;

  const unsubscribers: Array<() => void> = [];

  unsubscribers.push(
    useSettingsStore.subscribe((state, prev) => {
      if (
        state.audioEnabled !== prev.audioEnabled ||
        state.masterVolume !== prev.masterVolume ||
        state.musicVolume !== prev.musicVolume ||
        state.effectsVolume !== prev.effectsVolume ||
        state.sessionMusicMuted !== prev.sessionMusicMuted
      ) {
        audioEngine.handleSettingsOrVisibilityChange();
      }
    })
  );

  if (options.subscribeSaveStatus) {
    unsubscribers.push(
      options.subscribeSaveStatus((state, prev) => {
        if (useCollectionStore.getState().hydrating || state.bootStage !== 'ready') {
          return;
        }
        if (prev.status === 'saving' && state.status === 'saved') {
          audioEngine.playSound('save_tick', {
            visualCue: 'Progress saved to browser storage.',
          });
        } else if (prev.status !== 'error' && state.status === 'error') {
          audioEngine.playSound('error_buzz', {
            visualCue: state.errorMessage
              ? `Save error: ${state.errorMessage}`
              : 'Could not save progress to browser storage.',
          });
        }
      })
    );
  }

  if (typeof document !== 'undefined') {
    const onVisibility = () => {
      audioEngine.handleSettingsOrVisibilityChange();
    };
    document.addEventListener('visibilitychange', onVisibility);
    unsubscribers.push(() =>
      document.removeEventListener('visibilitychange', onVisibility)
    );
  }

  return () => {
    wiringAttached = false;
    while (unsubscribers.length > 0) {
      unsubscribers.pop()?.();
    }
  };
}
