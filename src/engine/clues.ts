import type { ClueDef } from './types';
import { getNewGrants } from './unlock';
import { normalizeMeridianUrl } from './url';

export function normalizeClueText(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase();
}

export interface ClueMatchResult {
  matchedClues: ClueDef[];
  newFacts: string[];
}

export function matchClues(
  pageUrl: string,
  capturedText: string,
  clueDefs: readonly ClueDef[],
  knownFacts: ReadonlySet<string>
): ClueMatchResult {
  const normalizedPageUrl = normalizeMeridianUrl(pageUrl);
  const normalizedCaptured = normalizeClueText(capturedText);

  if (!normalizedPageUrl || !normalizedCaptured) {
    return { matchedClues: [], newFacts: [] };
  }

  const matchedClues: ClueDef[] = [];
  const candidateGrants: string[] = [];

  for (const clue of clueDefs) {
    const clueUrl = normalizeMeridianUrl(clue.pageUrl);
    if (clueUrl !== normalizedPageUrl) {
      continue;
    }

    const clueText = normalizeClueText(clue.text);
    if (!clueText) {
      continue;
    }

    if (normalizedCaptured === clueText || normalizedCaptured.includes(clueText)) {
      matchedClues.push(clue);
      candidateGrants.push(...clue.grants);
    }
  }

  return {
    matchedClues,
    newFacts: getNewGrants(candidateGrants, knownFacts),
  };
}
