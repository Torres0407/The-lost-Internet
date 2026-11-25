export const SETTINGS_VERSION = 1 as const;
export const SETTINGS_STORAGE_KEY = 'tli:settings';

export type TextScale = 100 | 125 | 150;
export type ContrastSetting = 'normal' | 'high';
export type MotionSetting = 'system' | 'reduce' | 'full';

export type Settings = {
  version: 1;
  audioEnabled: boolean;
  audioChoiceMade: boolean;
  masterVolume: number;
  musicVolume: number;
  effectsVolume: number;
  modemSound: boolean;
  soundLogVisible: boolean;
  textScale: TextScale;
  contrast: ContrastSetting;
  motion: MotionSetting;
  scanlines: boolean;
  glitchEffects: boolean;
};

export const DEFAULT_SETTINGS: Settings = Object.freeze({
  version: 1,
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

export function createDefaultSettings(): Settings {
  return { ...DEFAULT_SETTINGS };
}

export function clamp01(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  if (value <= 0) {
    return 0;
  }
  if (value >= 1) {
    return 1;
  }
  return Math.round(value * 1000) / 1000;
}

function isValidTextScale(value: unknown): value is TextScale {
  return value === 100 || value === 125 || value === 150;
}

function isValidContrast(value: unknown): value is ContrastSetting {
  return value === 'normal' || value === 'high';
}

function isValidMotion(value: unknown): value is MotionSetting {
  return value === 'system' || value === 'reduce' || value === 'full';
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function validateSettings(raw: unknown): Settings {
  const defaults = createDefaultSettings();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return defaults;
  }

  const candidate = raw as Record<string, unknown>;

  return {
    version: SETTINGS_VERSION,
    audioEnabled: asBoolean(candidate.audioEnabled, defaults.audioEnabled),
    audioChoiceMade: asBoolean(candidate.audioChoiceMade, defaults.audioChoiceMade),
    masterVolume: clamp01(candidate.masterVolume, defaults.masterVolume),
    musicVolume: clamp01(candidate.musicVolume, defaults.musicVolume),
    effectsVolume: clamp01(candidate.effectsVolume, defaults.effectsVolume),
    modemSound: asBoolean(candidate.modemSound, defaults.modemSound),
    soundLogVisible: asBoolean(candidate.soundLogVisible, defaults.soundLogVisible),
    textScale: isValidTextScale(candidate.textScale)
      ? candidate.textScale
      : defaults.textScale,
    contrast: isValidContrast(candidate.contrast)
      ? candidate.contrast
      : defaults.contrast,
    motion: isValidMotion(candidate.motion) ? candidate.motion : defaults.motion,
    scanlines: asBoolean(candidate.scanlines, defaults.scanlines),
    glitchEffects: asBoolean(candidate.glitchEffects, defaults.glitchEffects),
  };
}

export function parseSettings(rawJson: string | null | undefined): Settings {
  if (!rawJson || typeof rawJson !== 'string') {
    return createDefaultSettings();
  }
  try {
    const parsed: unknown = JSON.parse(rawJson);
    return validateSettings(parsed);
  } catch {
    return createDefaultSettings();
  }
}

export function serializeSettings(settings: Settings): string {
  return JSON.stringify(validateSettings(settings));
}

export function resolveMotion(
  setting: MotionSetting,
  systemPrefersReduced: boolean
): 'reduced' | 'full' {
  if (setting === 'reduce') {
    return 'reduced';
  }
  if (setting === 'full') {
    return 'full';
  }
  return systemPrefersReduced ? 'reduced' : 'full';
}

export function resolveContrast(
  setting: ContrastSetting,
  systemPrefersMoreContrast: boolean,
  forcedHighContrast: boolean = false
): 'normal' | 'high' {
  if (forcedHighContrast || setting === 'high') {
    return 'high';
  }
  return systemPrefersMoreContrast ? 'high' : 'normal';
}

export function textScaleToMultiplier(textScale: TextScale): number {
  return textScale / 100;
}
