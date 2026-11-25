import { useEffect, useId, useRef, useState } from 'react';
import type { UnlockedInsight } from '../../state/notebookStore';

interface NotesTabProps {
  freeNotes: string;
  insights: UnlockedInsight[];
  onSaveNotes: (value: string) => void;
}

export function NotesTab({ freeNotes, insights, onSaveNotes }: NotesTabProps) {
  const [draft, setDraft] = useState(freeNotes);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const notesInputId = useId();

  const latestDraftRef = useRef(draft);
  latestDraftRef.current = draft;
  const onSaveRef = useRef(onSaveNotes);
  onSaveRef.current = onSaveNotes;

  useEffect(() => {
    setDraft(freeNotes);
  }, [freeNotes]);

  useEffect(() => {
    if (draft === freeNotes) {
      return;
    }

    setSaveStatus('saving');
    const timer = window.setTimeout(() => {
      onSaveRef.current(draft);
      setSaveStatus('saved');
    }, 350);

    return () => window.clearTimeout(timer);
  }, [draft, freeNotes]);

  // Flush pending edits on unmount
  useEffect(() => {
    return () => {
      onSaveRef.current(latestDraftRef.current);
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto p-3.5 space-y-4">
      <section aria-label="Unlocked insights">
        <h3
          className="font-chrome mb-2 text-[13px] font-semibold"
          style={{ color: 'var(--color-amber)' }}
        >
          Insights ({insights.length})
        </h3>
        {insights.length === 0 ? (
          <p
            className="font-body text-[12px]"
            style={{ color: 'var(--color-paper-muted)' }}
          >
            Link related clues on the Board tab to record insights here.
          </p>
        ) : (
          <ul className="space-y-2">
            {insights.map((insight) => (
              <li
                key={insight.id}
                className="border p-2.5"
                style={{
                  backgroundColor: 'var(--color-panel-deep)',
                  borderColor: 'rgba(255, 179, 71, 0.45)',
                }}
              >
                <div
                  className="font-chrome text-[13px] font-semibold"
                  style={{ color: 'var(--color-phosphor)' }}
                >
                  {insight.title}
                </div>
                <p
                  className="font-body mt-1 text-[12px] leading-relaxed"
                  style={{ color: 'var(--color-paper)' }}
                >
                  {insight.text}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Scratchpad notes" className="flex min-h-[180px] flex-1 flex-col">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label
            htmlFor={notesInputId}
            className="font-chrome text-[13px] font-semibold"
            style={{ color: 'var(--color-paper)' }}
          >
            Field notes
          </label>
          <span
            className="font-mono-tabular text-[11px]"
            style={{
              color:
                saveStatus === 'saved'
                  ? 'var(--color-phosphor)'
                  : 'var(--color-paper-muted)',
            }}
          >
            {saveStatus === 'saving'
              ? 'Saving...'
              : saveStatus === 'saved'
                ? 'Saved'
                : 'Autosaved'}
          </span>
        </div>

        <textarea
          id={notesInputId}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            onSaveNotes(draft);
            setSaveStatus('saved');
          }}
          placeholder="Write timelines, usernames, hypotheses, or URLs to test..."
          className="os-bevel-sunken os-focus-ring font-body min-h-[150px] flex-1 resize-none p-3 text-[0.8125rem] leading-relaxed"
          style={{
            backgroundColor: 'var(--card-paper)',
            color: 'var(--card-ink)',
          }}
        />
      </section>
    </div>
  );
}
