export type SoundId =
  | 'ui_click'
  | 'window_open'
  | 'window_close'
  | 'notification_chime'
  | 'insight_chime'
  | 'artifact_chime'
  | 'error_buzz'
  | 'save_tick'
  | 'modem_handshake'
  | 'music_started'
  | 'music_stopped';

export type SoundCategory = 'informational' | 'decorative';

export interface SoundDefinition {
  id: SoundId;
  label: string;
  category: SoundCategory;
  /** Non-empty caption required for all informational sounds so audio is never required. */
  visualCue: string | null;
}

export const SOUND_REGISTRY: Record<SoundId, SoundDefinition> = {
  ui_click: {
    id: 'ui_click',
    label: 'Button click',
    category: 'decorative',
    visualCue: null,
  },
  window_open: {
    id: 'window_open',
    label: 'Window open',
    category: 'decorative',
    visualCue: null,
  },
  window_close: {
    id: 'window_close',
    label: 'Window close',
    category: 'decorative',
    visualCue: null,
  },
  notification_chime: {
    id: 'notification_chime',
    label: 'Notification chime',
    category: 'informational',
    visualCue: 'Archive notice received.',
  },
  insight_chime: {
    id: 'insight_chime',
    label: 'Insight chime',
    category: 'informational',
    visualCue: 'New insight recorded in Notebook.',
  },
  artifact_chime: {
    id: 'artifact_chime',
    label: 'Artifact chime',
    category: 'informational',
    visualCue: 'New item added to Archive Index.',
  },
  error_buzz: {
    id: 'error_buzz',
    label: 'Error tone',
    category: 'informational',
    visualCue: 'Operation warning or error.',
  },
  save_tick: {
    id: 'save_tick',
    label: 'Save tick',
    category: 'informational',
    visualCue: 'Progress saved to browser storage.',
  },
  modem_handshake: {
    id: 'modem_handshake',
    label: 'Modem handshake',
    category: 'informational',
    visualCue: 'Dial-up modem connected to Meridian Ring.',
  },
  music_started: {
    id: 'music_started',
    label: 'Site music started',
    category: 'informational',
    visualCue: 'Site background music started.',
  },
  music_stopped: {
    id: 'music_stopped',
    label: 'Site music stopped',
    category: 'informational',
    visualCue: 'Site background music stopped.',
  },
};

export const ALL_SOUND_IDS = Object.keys(SOUND_REGISTRY) as readonly SoundId[];

export function isInformationalSound(id: SoundId): boolean {
  return SOUND_REGISTRY[id].category === 'informational';
}
