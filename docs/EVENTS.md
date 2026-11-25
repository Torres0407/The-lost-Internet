# Game & Shell Event Bus Reference

Events emitted by **The Lost Internet** are strictly client-side and typed in `src/events/eventBus.ts`. Collection unlock events use a portable shape intended for future ARCADE profile integration (no network calls are made).

| Event Name | Channel / Emitter | Payload Shape | Trigger |
| --- | --- | --- | --- |
| `artifact_unlocked` | `emitCollectionEvent` | `{ game: "the-lost-internet", id: string, type: "artifact", timestamp: number }` | Newly unlocked artifact recorded by `runEvaluation` |
| `achievement_unlocked` | `emitCollectionEvent` | `{ game: "the-lost-internet", id: string, type: "achievement", timestamp: number }` | Newly unlocked achievement recorded by `runEvaluation` |
| `source_viewed` | `emitShellEvent` / `emitCollectionEvent` | `{ url: string }` | User opens View Source on a resolved page |
| `clue_saved` | `emitShellEvent` | `{ type: "clue_saved", text: string, sourceUrl: string, sourceTitle: string }` | User saves selected text to the Notebook |
| `os/announce` | `emitShellEvent` | `{ type: "os/announce", message: string }` | Screen-reader announcement routed to the desktop `aria-live` status region |
