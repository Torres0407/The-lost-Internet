import { describe, expect, it } from 'vitest';
import {
  BISCUITS_WALTZ,
  getTrackForUrl,
  RING_HUB_HUM,
} from '../content/audio';
import {
  getStepDurationSeconds,
  noteToFrequency,
  scheduleSteps,
} from './music';

describe('procedural music engine & site soundtrack patterns', () => {
  it('converts MIDI note numbers to standard equal-temperament Hz', () => {
    expect(noteToFrequency(69)).toBeCloseTo(440, 6);
    expect(noteToFrequency(60)).toBeCloseTo(261.6256, 3);
    expect(noteToFrequency(57)).toBeCloseTo(220, 6);
    expect(() => noteToFrequency(Number.NaN)).toThrow();
  });

  it('computes exact step duration from tempo and steps-per-beat', () => {
    expect(getStepDurationSeconds(BISCUITS_WALTZ)).toBeCloseTo(0.3125, 6);
    expect(getStepDurationSeconds(RING_HUB_HUM)).toBeCloseTo(1.0, 6);
  });

  it('schedules steps across loop wrap-around without omitting downbeats or rests', () => {
    const scheduled = scheduleSteps(RING_HUB_HUM, 6, 4);
    expect(scheduled.map((n) => n.stepIndex)).toEqual([0]);
    expect(scheduled[0].stepOffset).toBe(2);
    expect(scheduled[0].frequency).toBeCloseTo(noteToFrequency(48), 4);
  });

  it("defines Biscuit's Waltz in C major 3/4 at 96 bpm over 32 bars (192 steps)", () => {
    expect(BISCUITS_WALTZ.id).toBe('biscuits_waltz');
    expect(BISCUITS_WALTZ.timeSignature).toEqual([3, 4]);
    expect(BISCUITS_WALTZ.tempoBpm).toBe(96);
    expect(BISCUITS_WALTZ.totalSteps).toBe(192);
    expect(BISCUITS_WALTZ.voices).toHaveLength(2);
    expect(BISCUITS_WALTZ.voices[0].waveform).toBe('square');
    expect(BISCUITS_WALTZ.voices[1].waveform).toBe('triangle');
    expect(BISCUITS_WALTZ.voices[0].steps).toHaveLength(192);
    expect(BISCUITS_WALTZ.voices[1].steps).toHaveLength(192);

    // Every note in Biscuit's Waltz stays within C major pitch classes (no sharps/flats)
    const cMajorPitchClasses = new Set([0, 2, 4, 5, 7, 9, 11]);
    for (const voice of BISCUITS_WALTZ.voices) {
      for (const note of voice.steps) {
        if (note !== null) {
          expect(cMajorPitchClasses.has(note % 12)).toBe(true);
        }
      }
    }
  });

  it('keeps Ring Hub ambient loop quiet and simple', () => {
    expect(RING_HUB_HUM.id).toBe('ring_hub_hum');
    expect(RING_HUB_HUM.voices[0].gain).toBeLessThanOrEqual(0.15);
    expect(RING_HUB_HUM.voices[0].steps).toHaveLength(RING_HUB_HUM.totalSteps);
  });

  it('maps site URLs to expected tracks and leaves other sites silent', () => {
    expect(getTrackForUrl('meridian://delphines-garden/')?.id).toBe('biscuits_waltz');
    expect(getTrackForUrl('meridian://delphines-garden/guestbook')?.id).toBe(
      'biscuits_waltz'
    );
    expect(getTrackForUrl('meridian://ring-hub/')?.id).toBe('ring_hub_hum');
    expect(getTrackForUrl('meridian://tumbleweed/')?.id ?? null).toBeNull();
    expect(getTrackForUrl('meridian://nightcrawler/')?.id ?? null).toBeNull();
    expect(getTrackForUrl('meridian://backroom/')?.id ?? null).toBeNull();
  });
});
