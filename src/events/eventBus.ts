import type { DesktopAppId } from '../os/types';

export interface CollectionUnlockPayload {
  game: 'the-lost-internet';
  id: string;
  type: 'artifact' | 'achievement';
  timestamp: number;
}

export type ShellEvent =
  | { type: 'desktop/icon-selected'; iconId: DesktopAppId | null }
  | { type: 'desktop/icon-activated'; iconId: DesktopAppId }
  | {
      type: 'clue_saved';
      text: string;
      sourceUrl: string;
      sourceTitle: string;
    }
  | { type: 'source_viewed'; url: string }
  | { type: 'os/announce'; message: string }
  | { type: 'os/announce-assertive'; message: string }
  | {
      type: 'settings/open-tab';
      tab: 'display' | 'sound' | 'accessibility' | 'save';
    };

export interface CollectionEventMap {
  artifact_unlocked: CollectionUnlockPayload;
  achievement_unlocked: CollectionUnlockPayload;
  source_viewed: { url: string };
}

type Listener = (event: ShellEvent) => void;
type CollectionListener<K extends keyof CollectionEventMap> = (
  payload: CollectionEventMap[K]
) => void;

const listeners = new Set<Listener>();
const collectionListeners: {
  [K in keyof CollectionEventMap]: Set<CollectionListener<K>>;
} = {
  artifact_unlocked: new Set(),
  achievement_unlocked: new Set(),
  source_viewed: new Set(),
};

export function subscribeShellEvents(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitShellEvent(event: ShellEvent): void {
  listeners.forEach((listener) => listener(event));
  if (event.type === 'source_viewed') {
    emitCollectionEvent('source_viewed', { url: event.url });
  }
}

export function subscribeCollectionEvent<K extends keyof CollectionEventMap>(
  eventName: K,
  listener: CollectionListener<K>
): () => void {
  const bucket = collectionListeners[eventName];
  bucket.add(listener);
  return () => {
    bucket.delete(listener);
  };
}

export function emitCollectionEvent<K extends keyof CollectionEventMap>(
  eventName: K,
  payload: CollectionEventMap[K]
): void {
  collectionListeners[eventName].forEach((listener) => listener(payload));
}
