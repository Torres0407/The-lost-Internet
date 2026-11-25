export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export type ContrastLevel = 'normal-text' | 'large-text' | 'ui';

export interface ThemeContrastPair {
  name: string;
  theme: 'normal' | 'high';
  fg: string;
  bg: string;
  level: ContrastLevel;
}

export function parseHexColor(hex: string): RgbColor {
  const cleaned = hex.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(cleaned)) {
    const r = Number.parseInt(cleaned[0] + cleaned[0], 16);
    const g = Number.parseInt(cleaned[1] + cleaned[1], 16);
    const b = Number.parseInt(cleaned[2] + cleaned[2], 16);
    return { r, g, b };
  }
  if (/^[0-9a-f]{6}$/i.test(cleaned)) {
    const r = Number.parseInt(cleaned.slice(0, 2), 16);
    const g = Number.parseInt(cleaned.slice(2, 4), 16);
    const b = Number.parseInt(cleaned.slice(4, 6), 16);
    return { r, g, b };
  }
  throw new Error(`Unsupported hex color "${hex}"`);
}

function linearizeChannel(channel255: number): number {
  const srgb = channel255 / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHexColor(hex);
  const lr = linearizeChannel(r);
  const lg = linearizeChannel(g);
  const lb = linearizeChannel(b);
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

export function contrastRatio(foregroundHex: string, backgroundHex: string): number {
  const l1 = relativeLuminance(foregroundHex);
  const l2 = relativeLuminance(backgroundHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function requiredMinimumRatio(level: ContrastLevel): number {
  return level === 'normal-text' ? 4.5 : 3.0;
}

/**
 * Audited foreground/background pairs across Normal and High Contrast OS chrome themes.
 */
export const THEME_CONTRAST_PAIRS: readonly ThemeContrastPair[] = [
  // Normal CRT phosphor & paper palette
  {
    name: 'Normal: paper text on desktop dark bg',
    theme: 'normal',
    fg: '#e8e4d8',
    bg: '#0b1418',
    level: 'normal-text',
  },
  {
    name: 'Normal: muted paper on desktop dark bg',
    theme: 'normal',
    fg: '#b8c2be',
    bg: '#0b1418',
    level: 'normal-text',
  },
  {
    name: 'Normal: phosphor accent on desktop dark bg',
    theme: 'normal',
    fg: '#38f2b0',
    bg: '#0b1418',
    level: 'normal-text',
  },
  {
    name: 'Normal: amber accent on desktop dark bg',
    theme: 'normal',
    fg: '#ffb347',
    bg: '#0b1418',
    level: 'normal-text',
  },
  {
    name: 'Normal: alert magenta on desktop dark bg',
    theme: 'normal',
    fg: '#ff70b8',
    bg: '#0b1418',
    level: 'normal-text',
  },
  {
    name: 'Normal: paper text on panel',
    theme: 'normal',
    fg: '#e8e4d8',
    bg: '#1d3a3f',
    level: 'normal-text',
  },
  {
    name: 'Normal: phosphor text on deep panel',
    theme: 'normal',
    fg: '#38f2b0',
    bg: '#13282c',
    level: 'normal-text',
  },
  {
    name: 'Normal: paper text on deep panel',
    theme: 'normal',
    fg: '#e8e4d8',
    bg: '#13282c',
    level: 'normal-text',
  },
  {
    name: 'Normal: dark ink on manilla card paper',
    theme: 'normal',
    fg: '#0b1418',
    bg: '#e8e4d8',
    level: 'normal-text',
  },
  {
    name: 'Normal: teal ink on locked catalogue card',
    theme: 'normal',
    fg: '#13282c',
    bg: '#d4cfc2',
    level: 'normal-text',
  },
  {
    name: 'Normal: amber warning on panel',
    theme: 'normal',
    fg: '#ffb347',
    bg: '#1d3a3f',
    level: 'normal-text',
  },
  {
    name: 'Normal: focus ring phosphor on panel',
    theme: 'normal',
    fg: '#38f2b0',
    bg: '#1d3a3f',
    level: 'ui',
  },

  // High Contrast theme (#000000 bg, #ffffff text, #ffff00 focus & links)
  {
    name: 'High contrast: white text on black',
    theme: 'high',
    fg: '#ffffff',
    bg: '#000000',
    level: 'normal-text',
  },
  {
    name: 'High contrast: yellow focus/accent on black',
    theme: 'high',
    fg: '#ffff00',
    bg: '#000000',
    level: 'normal-text',
  },
  {
    name: 'High contrast: black text on yellow selected chip',
    theme: 'high',
    fg: '#000000',
    bg: '#ffff00',
    level: 'normal-text',
  },
  {
    name: 'High contrast: alert coral on black',
    theme: 'high',
    fg: '#ff80c0',
    bg: '#000000',
    level: 'normal-text',
  },
  {
    name: 'High contrast: light border on black surface',
    theme: 'high',
    fg: '#ffffff',
    bg: '#000000',
    level: 'ui',
  },
];

export interface ContrastAuditFailure {
  pair: ThemeContrastPair;
  ratio: number;
  minimum: number;
}

export function auditThemeContrast(
  pairs: readonly ThemeContrastPair[] = THEME_CONTRAST_PAIRS
): { passed: boolean; failures: ContrastAuditFailure[] } {
  const failures: ContrastAuditFailure[] = [];

  for (const pair of pairs) {
    const ratio = contrastRatio(pair.fg, pair.bg);
    const minimum = requiredMinimumRatio(pair.level);
    if (ratio < minimum) {
      failures.push({ pair, ratio, minimum });
    }
  }

  return {
    passed: failures.length === 0,
    failures,
  };
}
