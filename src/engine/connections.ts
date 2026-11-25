import { normalizeClueText } from './clues';
import type { NotebookState } from './notebook';
import type { ConnectionDef } from './types';
import { getNewGrants } from './unlock';

export interface EvaluateLinkResult {
  insight: ConnectionDef | null;
  newFacts: string[];
}

export function evaluateLink(
  state: NotebookState,
  linkId: string,
  connections: readonly ConnectionDef[],
  knownFacts: ReadonlySet<string>
): EvaluateLinkResult {
  const link = state.links.find((item) => item.id === linkId);
  if (!link) {
    return { insight: null, newFacts: [] };
  }

  const clueA = state.clues.find((c) => c.id === link.fromClueId);
  const clueB = state.clues.find((c) => c.id === link.toClueId);
  if (!clueA || !clueB) {
    return { insight: null, newFacts: [] };
  }

  const textA = normalizeClueText(clueA.text);
  const textB = normalizeClueText(clueB.text);

  for (const conn of connections) {
    const matcherOne = normalizeClueText(conn.clueMatchers[0]);
    const matcherTwo = normalizeClueText(conn.clueMatchers[1]);
    if (!matcherOne || !matcherTwo) {
      continue;
    }

    const forwardMatch = textA.includes(matcherOne) && textB.includes(matcherTwo);
    const reverseMatch = textA.includes(matcherTwo) && textB.includes(matcherOne);

    if (forwardMatch || reverseMatch) {
      return {
        insight: conn,
        newFacts: getNewGrants(conn.grants, knownFacts),
      };
    }
  }

  return { insight: null, newFacts: [] };
}
