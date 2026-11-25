import { describe, expect, it } from 'vitest';
import {
  coerceAddressInput,
  createNotFoundPage,
  normalizeMeridianUrl,
} from './pages';

describe('URL normalization and 404 page builder', () => {
  it('normalizes host case, trailing slashes, queries, and fragments', () => {
    expect(normalizeMeridianUrl('meridian://RING-HUB')).toBe('meridian://ring-hub/');
    expect(normalizeMeridianUrl('meridian://Delphines-Garden/?ref=hub#notes')).toBe(
      'meridian://delphines-garden/'
    );
    expect(normalizeMeridianUrl('meridian://delphines-garden/guestbook/#entry-1')).toBe(
      'meridian://delphines-garden/guestbook'
    );
  });

  it('returns null for non-meridian or empty URLs', () => {
    expect(normalizeMeridianUrl('https://example.com/')).toBeNull();
    expect(normalizeMeridianUrl('')).toBeNull();
    expect(normalizeMeridianUrl('meridian:///missing-host')).toBeNull();
  });

  it('auto-prepends meridian:// for bare host or path inputs', () => {
    expect(coerceAddressInput('ring-hub')).toBe('meridian://ring-hub/');
    expect(coerceAddressInput('delphines-garden/guestbook')).toBe(
      'meridian://delphines-garden/guestbook'
    );
  });

  it('escapes HTML safely in the 404 and custom lockedNotice readout', () => {
    const page = createNotFoundPage('meridian://bad/<script>alert(1)</script>');
    expect(page.html).not.toContain('<script>');
    expect(page.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');

    const locked = createNotFoundPage(
      'meridian://secret/',
      'Access denied <img onerror=alert(1)>'
    );
    expect(locked.html).toContain('&lt;img onerror=alert(1)&gt;');
  });
});
