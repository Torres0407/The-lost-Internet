import { audioEngine } from '../audio/audioEngine';
import { CLUE_DEFS } from '../content/sites';
import { matchClues } from '../engine/clues';
import { useNotebookStore } from '../state/notebookStore';
import { useProgressStore } from '../state/progressStore';
import { emitShellEvent } from './eventBus';

export interface ClueSaveOutcome {
  saved: boolean;
  duplicate: boolean;
  grantedFacts: string[];
}

export function saveClueToNotebook(
  text: string,
  sourceUrl: string,
  sourceTitle: string = sourceUrl
): ClueSaveOutcome {
  const cleaned = text.trim();
  if (!cleaned) {
    return { saved: false, duplicate: false, grantedFacts: [] };
  }

  emitShellEvent({
    type: 'clue_saved',
    text: cleaned,
    sourceUrl,
    sourceTitle,
  });

  const duplicate = useNotebookStore.getState().lastSaveDuplicate;

  const progress = useProgressStore.getState();
  const { newFacts } = matchClues(sourceUrl, cleaned, CLUE_DEFS, progress.facts);
  const grantedFacts = newFacts.length > 0 ? progress.addFacts(newFacts) : [];

  const announcement =
    grantedFacts.length > 0
      ? 'New insight'
      : duplicate
        ? 'Already in your notebook'
        : 'Clue saved';

  emitShellEvent({
    type: 'os/announce',
    message: announcement,
  });

  if (grantedFacts.length > 0) {
    audioEngine.playSound('insight_chime', {
      visualCue: `New insight recorded from clue "${cleaned}"`,
    });
  } else if (!duplicate) {
    audioEngine.playSound('notification_chime', {
      visualCue: `Clue saved to notebook: "${cleaned}"`,
    });
  }

  return {
    saved: true,
    duplicate,
    grantedFacts,
  };
}
