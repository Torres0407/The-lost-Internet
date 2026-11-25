import { describe, expect, it } from 'vitest';
import { CONNECTION_DEFS } from '../content/connections';
import { evaluateLink } from './connections';
import {
  addClue,
  addLink,
  createInitialNotebookState,
  hasLink,
  moveClue,
  normalizeNotebookText,
  removeClue,
  removeLink,
  updateClueNote,
  updateFreeNotes,
} from './notebook';
import type { ConnectionDef } from './types';

describe('notebook pure functions', () => {
  it('normalizes clue text by trimming and collapsing whitespace', () => {
    expect(normalizeNotebookText('   hello   world\n\t test  ')).toBe('hello world test');
  });

  it('adds a clue immutably and stores default x/y board coordinates', () => {
    const initial = createInitialNotebookState();
    const res = addClue(initial, {
      id: 'c1',
      text: '  keep the   light on - 11/09 ',
      sourceUrl: 'meridian://delphines-garden/guestbook',
      sourceTitle: "Delphine's Guestbook",
      savedAt: 1000,
    });

    expect(initial.clues).toHaveLength(0);
    expect(res.duplicate).toBe(false);
    expect(res.clue.text).toBe('keep the light on - 11/09');
    expect(typeof res.clue.x).toBe('number');
    expect(typeof res.clue.y).toBe('number');
    expect(res.state.clues).toHaveLength(1);
  });

  it('deduplicates saving the same normalized text from the same URL and returns the existing clue', () => {
    const s1 = addClue(createInitialNotebookState(), {
      id: 'c1',
      text: 'keep the light on - 11/09',
      sourceUrl: 'meridian://DELPHINES-GARDEN/guestbook/',
      sourceTitle: "Delphine's Guestbook",
      savedAt: 1000,
    });

    const s2 = addClue(s1.state, {
      id: 'c2',
      text: '  keep   the light\non - 11/09  ',
      sourceUrl: 'meridian://delphines-garden/guestbook',
      sourceTitle: "Delphine's Guestbook",
      savedAt: 2000,
    });

    expect(s2.duplicate).toBe(true);
    expect(s2.clue).toEqual(s1.clue);
    expect(s2.state.clues).toHaveLength(1);
  });

  it('allows identical text when saved from different source URLs', () => {
    const s1 = addClue(createInitialNotebookState(), {
      id: 'c1',
      text: '11/09',
      sourceUrl: 'meridian://delphines-garden/guestbook',
      sourceTitle: "Delphine's Guestbook",
    });
    const s2 = addClue(s1.state, {
      id: 'c2',
      text: '11/09',
      sourceUrl: 'meridian://tumbleweed/support',
      sourceTitle: 'Tumbleweed Support',
    });

    expect(s2.duplicate).toBe(false);
    expect(s2.state.clues).toHaveLength(2);
  });

  it('updates clue notes immutably', () => {
    const s1 = addClue(createInitialNotebookState(), {
      id: 'c1',
      text: 'clue one',
      sourceUrl: 'meridian://ring-hub/',
      sourceTitle: 'Ring Hub',
    }).state;

    const s2 = updateClueNote(s1, 'c1', 'Check timestamp');
    expect(s1.clues[0].note).toBeUndefined();
    expect(s2.clues[0].note).toBe('Check timestamp');
  });

  it('moves clue card coordinates immutably and clamps negatives to 0', () => {
    const s1 = addClue(createInitialNotebookState(), {
      id: 'c1',
      text: 'clue one',
      sourceUrl: 'meridian://ring-hub/',
      sourceTitle: 'Ring Hub',
      x: 40,
      y: 60,
    }).state;

    const s2 = moveClue(s1, 'c1', -15, 145.6);
    expect(s1.clues[0].x).toBe(40);
    expect(s2.clues[0].x).toBe(0);
    expect(s2.clues[0].y).toBe(146);
  });

  it('updates freeNotes immutably', () => {
    const s1 = createInitialNotebookState();
    const s2 = updateFreeNotes(s1, 'Possible breach on 11/09');
    expect(s1.freeNotes).toBe('');
    expect(s2.freeNotes).toBe('Possible breach on 11/09');
  });

  it('prevents self-links and links to non-existent clues', () => {
    const s1 = addClue(createInitialNotebookState(), {
      id: 'c1',
      text: 'clue one',
      sourceUrl: 'meridian://ring-hub/',
      sourceTitle: 'Ring Hub',
    }).state;

    const selfLink = addLink(s1, 'c1', 'c1');
    expect(selfLink.created).toBe(false);
    expect(selfLink.link).toBeNull();

    const missingLink = addLink(s1, 'c1', 'missing');
    expect(missingLink.created).toBe(false);
    expect(missingLink.link).toBeNull();
  });

  it('treats links as undirected and prevents duplicate links in either direction', () => {
    let state = addClue(createInitialNotebookState(), {
      id: 'c1',
      text: 'clue one',
      sourceUrl: 'meridian://ring-hub/',
      sourceTitle: 'Ring Hub',
    }).state;
    state = addClue(state, {
      id: 'c2',
      text: 'clue two',
      sourceUrl: 'meridian://tumbleweed/support',
      sourceTitle: 'Support',
    }).state;

    const first = addLink(state, 'c1', 'c2');
    expect(first.created).toBe(true);
    expect(hasLink(first.state, 'c1', 'c2')).toBe(true);
    expect(hasLink(first.state, 'c2', 'c1')).toBe(true);
    expect(hasLink(first.state, 'c1', 'c1')).toBe(false);

    const dupReverse = addLink(first.state, 'c2', 'c1');
    expect(dupReverse.created).toBe(false);
    expect(dupReverse.link).toEqual(first.link);
    expect(dupReverse.state.links).toHaveLength(1);
  });

  it('removes attached links when a clue is removed, and removes individual links', () => {
    let state = addClue(createInitialNotebookState(), {
      id: 'c1',
      text: 'clue one',
      sourceUrl: 'meridian://ring-hub/',
      sourceTitle: 'Ring Hub',
    }).state;
    state = addClue(state, {
      id: 'c2',
      text: 'clue two',
      sourceUrl: 'meridian://tumbleweed/support',
      sourceTitle: 'Support',
    }).state;
    state = addClue(state, {
      id: 'c3',
      text: 'clue three',
      sourceUrl: 'meridian://delphines-garden/',
      sourceTitle: 'Garden',
    }).state;

    state = addLink(state, 'c1', 'c2').state;
    const link23 = addLink(state, 'c2', 'c3');
    state = link23.state;
    expect(state.links).toHaveLength(2);

    const afterLinkRemove = removeLink(state, link23.link!.id);
    expect(afterLinkRemove.links).toHaveLength(1);

    const afterClueRemove = removeClue(state, 'c2');
    expect(afterClueRemove.clues).toHaveLength(2);
    expect(afterClueRemove.links).toHaveLength(0);
  });
});

describe('evaluateLink connection evaluation', () => {
  const sampleConnections: readonly ConnectionDef[] = [
    ...CONNECTION_DEFS,
    {
      id: 'conn_extra',
      clueMatchers: ['ginger tea', 'halcyon'],
      grants: ['tea_hint'],
      insightTitle: 'Late Night Debugging',
      insightText: 'Wren drank ginger tea while working on HALCYON.',
    },
  ];

  function buildThreeCluesBoard() {
    let state = createInitialNotebookState();
    state = addClue(state, {
      id: 'c_date',
      text: 'keep the light on - 11/09',
      sourceUrl: 'meridian://delphines-garden/guestbook',
      sourceTitle: "Delphine's Guestbook",
    }).state;
    state = addClue(state, {
      id: 'c_maint',
      text: 'MAINTENANCE WINDOW starting on 11/09 at 23:00',
      sourceUrl: 'meridian://tumbleweed/support',
      sourceTitle: 'Tumbleweed Support',
    }).state;
    state = addClue(state, {
      id: 'c_soup',
      text: 'potato leek soup recipe',
      sourceUrl: 'meridian://delphines-garden/',
      sourceTitle: "Delphine's Garden",
    }).state;
    return state;
  }

  it('matches connection when linked in forward order (A -> B)', () => {
    const base = buildThreeCluesBoard();
    const linked = addLink(base, 'c_date', 'c_maint');
    const result = evaluateLink(
      linked.state,
      linked.link!.id,
      sampleConnections,
      new Set()
    );

    expect(result.insight?.id).toBe('conn_1109_maintenance');
    expect(result.newFacts).toEqual(['connection_1109']);
  });

  it('matches connection when linked in reverse order (B -> A)', () => {
    const base = buildThreeCluesBoard();
    const linked = addLink(base, 'c_maint', 'c_date');
    const result = evaluateLink(
      linked.state,
      linked.link!.id,
      sampleConnections,
      new Set()
    );

    expect(result.insight?.id).toBe('conn_1109_maintenance');
    expect(result.newFacts).toEqual(['connection_1109']);
  });

  it('does not re-grant facts that are already known', () => {
    const base = buildThreeCluesBoard();
    const linked = addLink(base, 'c_date', 'c_maint');
    const result = evaluateLink(
      linked.state,
      linked.link!.id,
      sampleConnections,
      new Set(['connection_1109'])
    );

    expect(result.insight?.id).toBe('conn_1109_maintenance');
    expect(result.newFacts).toEqual([]);
  });

  it('returns null insight and no facts for unrelated clue pairs', () => {
    const base = buildThreeCluesBoard();
    const linked = addLink(base, 'c_date', 'c_soup');
    const result = evaluateLink(
      linked.state,
      linked.link!.id,
      sampleConnections,
      new Set()
    );

    expect(result).toEqual({ insight: null, newFacts: [] });
  });

  it('returns null insight and no facts when linkId does not exist', () => {
    const base = buildThreeCluesBoard();
    const result = evaluateLink(base, 'nonexistent-link', sampleConnections, new Set());
    expect(result).toEqual({ insight: null, newFacts: [] });
  });
});
