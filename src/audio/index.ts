export interface AudioMixerConfig {
  readonly enabled: boolean;
}

export const DEFAULT_AUDIO_CONFIG: AudioMixerConfig = {
  enabled: false,
};
