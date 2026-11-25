import type { Pattern } from '../engine/music';
import { normalizeMeridianUrl } from '../engine/url';

// MIDI note helpers for clean readable notation in C major
const R = null; // rest
const G2 = 43;
const A2 = 45;
const B2 = 47;
const C3 = 48;
const D3 = 50;
const E3 = 52;
const F3 = 53;
const G3 = 55;
const A3 = 57;
const B3 = 59;
const C4 = 60;
const D4 = 62;
const E4 = 64;
const F4 = 65;
const G4 = 67;
const A4 = 69;
const B4 = 71;
const C5 = 72;
const D5 = 74;
const E5 = 76;
const F5 = 77;
const G5 = 79;

type Bar6 = readonly [
  number | null,
  number | null,
  number | null,
  number | null,
  number | null,
  number | null,
];

function flattenBars(bars: readonly Bar6[]): (number | null)[] {
  return bars.flat();
}

// 32-bar gentle C major waltz (3/4, 96 bpm, eighth-note steps -> 6 steps/bar = 192 steps)
const BISCUIT_MELODY_BARS: readonly Bar6[] = [
  // Section A (bars 1-8): Garden welcome
  [E4, R, G4, R, C5, R],
  [B4, R, A4, R, G4, R],
  [F4, R, A4, R, D5, R],
  [C5, R, B4, R, G4, R],
  [E4, R, G4, R, C5, R],
  [E5, R, D5, R, C5, R],
  [D5, R, R, R, B4, G4],
  [C5, R, R, R, R, R],

  // Section A' (bars 9-16): Window sill sunbeam
  [G4, R, C5, R, E5, R],
  [D5, R, C5, R, B4, R],
  [A4, R, C5, R, F5, R],
  [E5, R, D5, R, B4, R],
  [C5, R, G4, R, E4, R],
  [F4, R, A4, R, D5, R],
  [B4, R, G4, R, A4, B4],
  [C5, R, R, R, R, R],

  // Section B (bars 17-24): Biscuit chases a dandelion seed
  [A4, R, C5, R, E5, R],
  [D5, R, C5, R, A4, R],
  [F4, R, A4, R, C5, R],
  [B4, R, A4, R, G4, R],
  [A4, R, B4, R, C5, R],
  [D5, R, E5, R, F5, R],
  [E5, R, D5, R, C5, R],
  [G4, R, R, R, R, R],

  // Section A'' (bars 25-32): Evening tea & gentle turnaround
  [E4, R, G4, R, C5, R],
  [B4, R, A4, R, G4, R],
  [F4, R, A4, R, D5, R],
  [G5, R, F5, R, D5, R],
  [E5, R, C5, R, G4, R],
  [A4, R, F4, R, D4, R],
  [G4, R, D5, R, B4, R],
  [C5, R, R, R, R, R],
];

const BISCUIT_BASS_BARS: readonly Bar6[] = [
  // Bars 1-8
  [C3, R, E3, R, G3, R],
  [E3, R, G3, R, C4, R],
  [D3, R, F3, R, A3, R],
  [G2, R, D3, R, G3, R],
  [C3, R, E3, R, G3, R],
  [A2, R, E3, R, A3, R],
  [G2, R, D3, R, G3, R],
  [C3, R, G3, R, C4, R],

  // Bars 9-16
  [C3, R, E3, R, G3, R],
  [G2, R, D3, R, B3, R],
  [F3, R, A3, R, C4, R],
  [G2, R, D3, R, G3, R],
  [C3, R, E3, R, G3, R],
  [D3, R, F3, R, A3, R],
  [G2, R, D3, R, G3, R],
  [C3, R, E3, R, G3, R],

  // Bars 17-24
  [A2, R, E3, R, A3, R],
  [A2, R, E3, R, C4, R],
  [F3, R, A3, R, C4, R],
  [G2, R, D3, R, G3, R],
  [F3, R, A3, R, C4, R],
  [D3, R, F3, R, A3, R],
  [C3, R, E3, R, G3, R],
  [G2, R, D3, R, G3, R],

  // Bars 25-32
  [C3, R, E3, R, G3, R],
  [E3, R, G3, R, C4, R],
  [D3, R, F3, R, A3, R],
  [G2, R, D3, R, B3, R],
  [C3, R, E3, R, G3, R],
  [F3, R, A3, R, C4, R],
  [G2, R, D3, R, G3, R],
  [C3, R, E3, R, G3, R],
];

export const BISCUITS_WALTZ: Pattern = {
  id: 'biscuits_waltz',
  title: "Biscuit's Waltz.mid",
  tempoBpm: 96,
  stepsPerBeat: 2,
  timeSignature: [3, 4],
  totalSteps: 192,
  voices: [
    {
      id: 'melody',
      waveform: 'square',
      gain: 0.14,
      steps: flattenBars(BISCUIT_MELODY_BARS),
    },
    {
      id: 'waltz-bass',
      waveform: 'triangle',
      gain: 0.24,
      steps: flattenBars(BISCUIT_BASS_BARS),
    },
  ],
};

export const RING_HUB_HUM: Pattern = {
  id: 'ring_hub_hum',
  title: 'Ring Hub (ambient).mid',
  tempoBpm: 60,
  stepsPerBeat: 1,
  timeSignature: [4, 4],
  totalSteps: 8,
  voices: [
    {
      id: 'hum',
      waveform: 'triangle',
      gain: 0.1,
      steps: [C3, R, R, R, G2, R, R, R],
    },
  ],
};

export const AUDIO_TRACKS: Record<string, Pattern> = {
  [BISCUITS_WALTZ.id]: BISCUITS_WALTZ,
  [RING_HUB_HUM.id]: RING_HUB_HUM,
};

export interface SiteTrackMapping {
  urlPrefix: string;
  trackId: string;
}

export const SITE_TRACKS: readonly SiteTrackMapping[] = [
  { urlPrefix: 'meridian://delphines-garden/', trackId: 'biscuits_waltz' },
  { urlPrefix: 'meridian://ring-hub/', trackId: 'ring_hub_hum' },
];

export function getTrackForUrl(url: string): Pattern | null {
  const normalized = normalizeMeridianUrl(url);
  if (!normalized) {
    return null;
  }

  for (const mapping of SITE_TRACKS) {
    if (normalized.startsWith(mapping.urlPrefix)) {
      return AUDIO_TRACKS[mapping.trackId] ?? null;
    }
  }
  return null;
}
