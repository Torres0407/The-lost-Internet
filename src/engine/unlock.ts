import type { PageDef } from './types';

export function getMissingFacts(
  page: Pick<PageDef, 'requires'>,
  knownFacts: ReadonlySet<string>
): string[] {
  const requires = page.requires;
  if (!requires || requires.length === 0) {
    return [];
  }
  return requires.filter((factId) => !knownFacts.has(factId));
}

export function isUnlocked(
  page: Pick<PageDef, 'requires'>,
  knownFacts: ReadonlySet<string>
): boolean {
  return getMissingFacts(page, knownFacts).length === 0;
}

export function getNewGrants(
  grants: readonly string[] | undefined,
  knownFacts: ReadonlySet<string>
): string[] {
  if (!grants || grants.length === 0) {
    return [];
  }
  const uniqueNew: string[] = [];
  const seen = new Set<string>();
  for (const factId of grants) {
    if (!knownFacts.has(factId) && !seen.has(factId)) {
      seen.add(factId);
      uniqueNew.push(factId);
    }
  }
  return uniqueNew;
}

export function applyGrants(
  grants: readonly string[] | undefined,
  knownFacts: ReadonlySet<string>
): Set<string> {
  const next = new Set(knownFacts);
  if (!grants || grants.length === 0) {
    return next;
  }
  for (const factId of grants) {
    next.add(factId);
  }
  return next;
}
