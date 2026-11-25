import type { ViewportBounds } from './types';

export const MIN_WINDOW_WIDTH = 320;
export const MIN_WINDOW_HEIGHT = 220;
export const WINDOW_CASCADE_STEP = 24;
export const WINDOW_BASE_OFFSET_X = 96;
export const WINDOW_BASE_OFFSET_Y = 40;
export const TITLE_BAR_HEIGHT = 36;

export const DEFAULT_VIEWPORT: ViewportBounds = {
  width: 1280,
  height: 720,
};

export function clampWindowSize(
  width: number,
  height: number,
  x: number,
  y: number,
  viewport: ViewportBounds = DEFAULT_VIEWPORT
): { width: number; height: number } {
  const availableWidth = Math.max(MIN_WINDOW_WIDTH, viewport.width - Math.max(0, x));
  const availableHeight = Math.max(MIN_WINDOW_HEIGHT, viewport.height - Math.max(0, y));

  const clampedWidth = Math.min(Math.max(width, MIN_WINDOW_WIDTH), availableWidth);
  const clampedHeight = Math.min(Math.max(height, MIN_WINDOW_HEIGHT), availableHeight);

  return {
    width: Math.round(clampedWidth),
    height: Math.round(clampedHeight),
  };
}

export function clampWindowPosition(
  x: number,
  y: number,
  width: number,
  height: number,
  viewport: ViewportBounds = DEFAULT_VIEWPORT
): { x: number; y: number } {
  const maxX = Math.max(0, viewport.width - width);
  // Keep the entire window in viewport when it fits, and never let the title bar go off-screen
  const maxY = Math.max(0, Math.min(viewport.height - height, viewport.height - TITLE_BAR_HEIGHT));

  return {
    x: Math.round(Math.min(Math.max(0, x), maxX)),
    y: Math.round(Math.min(Math.max(0, y), maxY)),
  };
}

export function getCascadedPosition(
  existingCount: number,
  width: number,
  height: number,
  viewport: ViewportBounds = DEFAULT_VIEWPORT
): { x: number; y: number } {
  const stepIndex = existingCount % 8;
  const rawX = WINDOW_BASE_OFFSET_X + stepIndex * WINDOW_CASCADE_STEP;
  const rawY = WINDOW_BASE_OFFSET_Y + stepIndex * WINDOW_CASCADE_STEP;

  return clampWindowPosition(rawX, rawY, width, height, viewport);
}
