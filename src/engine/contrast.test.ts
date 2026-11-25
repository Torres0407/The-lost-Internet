import { describe, expect, it } from 'vitest';
import {
  auditThemeContrast,
  contrastRatio,
  parseHexColor,
  relativeLuminance,
  THEME_CONTRAST_PAIRS,
} from './contrast';

describe('WCAG contrast checker and theme token audit', () => {
  it('computes exact luminance and contrast ratios for black and white', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 6);
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 6);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
  });

  it('supports shorthand 3-digit hex colors and rejects invalid colors', () => {
    expect(parseHexColor('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHexColor('000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(() => parseHexColor('not-a-color')).toThrow();
  });

  it('passes WCAG AA (4.5:1 normal text, 3.0:1 UI/large) across all Normal and High Contrast chrome pairs', () => {
    const result = auditThemeContrast(THEME_CONTRAST_PAIRS);
    expect(result.failures).toEqual([]);
    expect(result.passed).toBe(true);
  });

  it('detects and reports failing low-contrast pairs', () => {
    const result = auditThemeContrast([
      {
        name: 'Low contrast pair',
        theme: 'normal',
        fg: '#607070',
        bg: '#405050',
        level: 'normal-text',
      },
    ]);

    expect(result.passed).toBe(false);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0].minimum).toBe(4.5);
    expect(result.failures[0].ratio).toBeLessThan(4.5);
  });
});
