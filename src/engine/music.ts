export type WaveformType = 'sine' | 'triangle' | 'square' | 'sawtooth';

export interface PatternVoice {
  id: string;
  waveform: WaveformType;
  gain: number;
  steps: readonly (number | null)[];
}

export interface Pattern {
  id: string;
  title: string;
  tempoBpm: number;
  stepsPerBeat: number;
  timeSignature: readonly [number, number];
  totalSteps: number;
  voices: readonly PatternVoice[];
}

export interface ScheduledNote {
  voiceId: string;
  waveform: WaveformType;
  frequency: number;
  gain: number;
  stepIndex: number;
  stepOffset: number;
  durationSeconds: number;
}

export function noteToFrequency(midiNote: number): number {
  if (!Number.isFinite(midiNote)) {
    throw new Error(`Invalid MIDI note: ${midiNote}`);
  }
  return 440 * 2 ** ((midiNote - 69) / 12);
}

export function getStepDurationSeconds(pattern: Pick<Pattern, 'tempoBpm' | 'stepsPerBeat'>): number {
  const beatsPerSecond = pattern.tempoBpm / 60;
  const stepsPerSecond = beatsPerSecond * pattern.stepsPerBeat;
  return 1 / stepsPerSecond;
}

export function scheduleSteps(
  pattern: Pattern,
  startStep: number,
  count: number
): ScheduledNote[] {
  if (count <= 0 || pattern.totalSteps <= 0) {
    return [];
  }

  const baseStepDuration = getStepDurationSeconds(pattern);
  const notes: ScheduledNote[] = [];

  for (let offset = 0; offset < count; offset += 1) {
    const absoluteStep = startStep + offset;
    const wrappedStep =
      ((absoluteStep % pattern.totalSteps) + pattern.totalSteps) % pattern.totalSteps;

    for (const voice of pattern.voices) {
      const midiNote = voice.steps[wrappedStep] ?? null;
      if (midiNote === null) {
        continue;
      }

      // Compute note gate length across trailing rests up to 2 steps for smooth phrasing
      let sustainSteps = 1;
      for (let look = 1; look < 3; look += 1) {
        const nextIndex = (wrappedStep + look) % pattern.totalSteps;
        if (voice.steps[nextIndex] === null) {
          sustainSteps += 0.35;
        } else {
          break;
        }
      }

      notes.push({
        voiceId: voice.id,
        waveform: voice.waveform,
        frequency: noteToFrequency(midiNote),
        gain: voice.gain,
        stepIndex: wrappedStep,
        stepOffset: offset,
        durationSeconds: baseStepDuration * sustainSteps * 0.9,
      });
    }
  }

  return notes;
}
