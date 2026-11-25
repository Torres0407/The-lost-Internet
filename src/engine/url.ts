export const HOME_URL = 'meridian://ring-hub/';

export function normalizeMeridianUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return null;
  }

  const withoutHash = trimmed.split('#')[0] ?? '';
  const withoutQuery = withoutHash.split('?')[0] ?? '';

  if (!withoutQuery.toLowerCase().startsWith('meridian://')) {
    return null;
  }

  const remainder = withoutQuery.slice('meridian://'.length);
  const slashIndex = remainder.indexOf('/');

  const rawHost = slashIndex === -1 ? remainder : remainder.slice(0, slashIndex);
  const host = rawHost.toLowerCase();
  if (!host) {
    return null;
  }

  const rawPath = slashIndex === -1 ? '' : remainder.slice(slashIndex);
  if (rawPath === '' || rawPath === '/') {
    return `meridian://${host}/`;
  }

  const normalizedPath = rawPath.endsWith('/') ? rawPath.slice(0, -1) : rawPath;
  return `meridian://${host}${normalizedPath}`;
}

export function coerceAddressInput(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return HOME_URL;
  }

  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed);
  if (hasScheme) {
    return normalizeMeridianUrl(trimmed) ?? trimmed;
  }

  return normalizeMeridianUrl(`meridian://${trimmed}`) ?? `meridian://${trimmed}`;
}
