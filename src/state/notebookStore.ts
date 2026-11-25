import { create } from 'zustand';
import { audioEngine } from '../audio/audioEngine';
import { CONNECTION_DEFS } from '../content/connections';
import { evaluateLink } from '../engine/connections';
import {
  addClue,
  type AddClueInput,
  addLink,
  type Clue,
  createInitialNotebookState,
  hasLink,
  type Link,
  moveClue,
  type NotebookState,
  removeClue,
  removeLink,
  updateClueNote,
  updateFreeNotes,
} from '../engine/notebook';
import { emitShellEvent, subscribeShellEvents } from '../events/eventBus';
import type { PersistedInsight, PersistedNotebookState } from './progressPersistence';
import { useProgressStore } from './progressStore';

export type UnlockedInsight = PersistedInsight;

interface NotebookStore extends NotebookState {
  insights: UnlockedInsight[];
  lastSaveDuplicate: boolean;
  addClue: (input: AddClueInput) => { clue: Clue; duplicate: boolean };
  removeClue: (id: string) => void;
  updateClueNote: (id: string, note: string) => void;
  moveClue: (id: string, x: number, y: number) => void;
  addLink: (
    a: string,
    b: string
  ) => { link: Link | null; created: boolean; insight: UnlockedInsight | null };
  removeLink: (id: string) => void;
  hasLink: (a: string, b: string) => boolean;
  updateFreeNotes: (freeNotes: string) => void;
  addSampleClues: () => void;
  hydrateNotebook: (snapshot: {
    clues: readonly Clue[];
    links: readonly Link[];
    freeNotes: string;
    insights: readonly UnlockedInsight[];
  }) => void;
  clearNotebook: () => void;
}

function getNotebookSlice(state: NotebookStore): NotebookState {
  return {
    clues: state.clues,
    links: state.links,
    freeNotes: state.freeNotes,
  };
}

export const useNotebookStore = create<NotebookStore>((set, get) => ({
  ...createInitialNotebookState(),
  insights: [],
  lastSaveDuplicate: false,

  addClue: (input) => {
    const result = addClue(getNotebookSlice(get()), input);
    set({
      ...result.state,
      lastSaveDuplicate: result.duplicate,
    });
    return { clue: result.clue, duplicate: result.duplicate };
  },

  removeClue: (id) =>
    set((state) => ({
      ...removeClue(getNotebookSlice(state), id),
    })),

  updateClueNote: (id, note) =>
    set((state) => ({
      ...updateClueNote(getNotebookSlice(state), id, note),
    })),

  moveClue: (id, x, y) =>
    set((state) => ({
      ...moveClue(getNotebookSlice(state), id, x, y),
    })),

  addLink: (a, b) => {
    const current = getNotebookSlice(get());
    const linkResult = addLink(current, a, b);
    if (!linkResult.created || !linkResult.link) {
      return { link: linkResult.link, created: false, insight: null };
    }

    const progress = useProgressStore.getState();
    const evaluation = evaluateLink(
      linkResult.state,
      linkResult.link.id,
      CONNECTION_DEFS,
      progress.facts
    );

    let unlockedInsight: UnlockedInsight | null = null;
    let isNewInsight = false;
    let nextInsights = get().insights;

    if (evaluation.insight) {
      if (evaluation.newFacts.length > 0) {
        progress.addFacts(evaluation.newFacts);
      }

      const existingInsight = nextInsights.find(
        (item) => item.id === evaluation.insight!.id
      );

      if (existingInsight) {
        unlockedInsight = existingInsight;
      } else {
        isNewInsight = true;
        unlockedInsight = {
          id: evaluation.insight.id,
          title: evaluation.insight.insightTitle,
          text: evaluation.insight.insightText,
          unlockedAt: Date.now(),
        };
        nextInsights = [...nextInsights, unlockedInsight];
      }
    }

    set({
      ...linkResult.state,
      insights: nextInsights,
    });

    const clueA = current.clues.find((c) => c.id === a);
    const clueB = current.clues.find((c) => c.id === b);
    if (clueA && clueB) {
      const linkMsg = `Linked clue ${clueA.text} to clue ${clueB.text}`;
      const insightMsg = unlockedInsight
        ? `New insight: ${unlockedInsight.title}`
        : '';
      emitShellEvent({
        type: 'os/announce',
        message: insightMsg ? `${linkMsg}. ${insightMsg}` : linkMsg,
      });
    }

    if (isNewInsight && unlockedInsight) {
      audioEngine.playSound('insight_chime', {
        visualCue: `New insight unlocked: ${unlockedInsight.title}`,
      });
    }

    return {
      link: linkResult.link,
      created: true,
      insight: unlockedInsight,
    };
  },

  removeLink: (id) =>
    set((state) => ({
      ...removeLink(getNotebookSlice(state), id),
    })),

  hasLink: (a, b) => hasLink(getNotebookSlice(get()), a, b),

  updateFreeNotes: (freeNotes) =>
    set((state) => ({
      ...updateFreeNotes(getNotebookSlice(state), freeNotes),
    })),

  addSampleClues: () => {
    const store = get();
    store.addClue({
      text: 'keep the light on - 11/09',
      sourceUrl: 'meridian://delphines-garden/guestbook',
      sourceTitle: "Delphine's Guestbook",
      x: 32,
      y: 36,
    });
    store.addClue({
      text: 'maintenance window starting on 11/09 at 23:00',
      sourceUrl: 'meridian://tumbleweed/support',
      sourceTitle: 'Tumbleweed Hosting — Support Bulletin',
      x: 280,
      y: 96,
    });
  },

  hydrateNotebook: (snapshot) =>
    set({
      clues: snapshot.clues.map((c) => ({ ...c, tags: [...c.tags] })),
      links: snapshot.links.map((l) => ({ ...l })),
      freeNotes: snapshot.freeNotes,
      insights: snapshot.insights.map((i) => ({ ...i })),
      lastSaveDuplicate: false,
    }),

  clearNotebook: () =>
    set({
      ...createInitialNotebookState(),
      insights: [],
      lastSaveDuplicate: false,
    }),
}));

export function toPersistedNotebook(state: NotebookStore): PersistedNotebookState {
  return {
    clues: state.clues.map((c) => ({ ...c, tags: [...c.tags] })),
    links: state.links.map((l) => ({ ...l })),
    freeNotes: state.freeNotes,
    insights: state.insights.map((i) => ({ ...i })),
  };
}

// Subscribe to clue_saved events emitted by the Browser or other tools
subscribeShellEvents((event) => {
  if (event.type === 'clue_saved') {
    useNotebookStore.getState().addClue({
      text: event.text,
      sourceUrl: event.sourceUrl,
      sourceTitle: event.sourceTitle,
    });
  }
});
