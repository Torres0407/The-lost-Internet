import type { ResolveResult, SiteRegistry } from './types';
import { getMissingFacts, getNewGrants, isUnlocked } from './unlock';
import { normalizeMeridianUrl } from './url';

export function resolveWithProgress(
  url: string,
  registry: SiteRegistry,
  knownFacts: ReadonlySet<string>
): ResolveResult {
  const normalized = normalizeMeridianUrl(url);
  if (!normalized) {
    return { status: 'not_found' };
  }

  const page = registry.pagesByUrl.get(normalized);
  if (!page) {
    return { status: 'not_found' };
  }

  if (!isUnlocked(page, knownFacts)) {
    return {
      status: 'locked',
      page,
      missing: getMissingFacts(page, knownFacts),
    };
  }

  return {
    status: 'ok',
    page,
    newFacts: getNewGrants(page.grants, knownFacts),
  };
}
