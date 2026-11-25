import { useId, useState } from 'react';
import { ExternalLink, Trash2 } from 'lucide-react';
import type { Clue } from '../../engine/notebook';

interface ClueCardProps {
  clue: Clue;
  index: number;
  onOpenSourceUrl: (url: string) => void;
  onUpdateNote: (id: string, note: string) => void;
  onDelete: (id: string) => void;
}

function formatSavedTime(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp));
}

export function ClueCard({
  clue,
  index,
  onOpenSourceUrl,
  onUpdateNote,
  onDelete,
}: ClueCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const noteId = useId();
  const tiltClass =
    index % 2 === 0 ? 'notebook-card-tilt-even' : 'notebook-card-tilt-odd';

  return (
    <article
      className={`${tiltClass} border p-3.5 shadow-sm`}
      style={{
        backgroundColor: 'var(--card-paper)',
        borderColor: 'var(--bevel-dark)',
        color: 'var(--card-ink)',
      }}
    >
      <div
        className="mb-2 flex items-start justify-between gap-2 border-b pb-1.5"
        style={{ borderBottomColor: 'var(--border-subtle)' }}
      >
        <button
          type="button"
          onClick={() => onOpenSourceUrl(clue.sourceUrl)}
          className="os-focus-ring font-body inline-flex min-w-0 cursor-pointer items-center gap-1.5 text-left text-[0.75rem] font-semibold underline underline-offset-2"
          style={{ color: 'var(--card-ink-muted)' }}
        >
          <span className="truncate">{clue.sourceTitle}</span>
          <ExternalLink size={12} aria-hidden="true" className="shrink-0" />
        </button>

        <time
          dateTime={new Date(clue.savedAt).toISOString()}
          className="font-mono-tabular shrink-0 text-[0.6875rem]"
          style={{ color: 'var(--card-ink-muted)' }}
        >
          {formatSavedTime(clue.savedAt)}
        </time>
      </div>

      <p
        className="font-body mb-3 text-[0.875rem] leading-snug font-medium"
        style={{ color: 'var(--card-ink)' }}
      >
        “{clue.text}”
      </p>

      <div className="space-y-2">
        <div>
          <label
            htmlFor={noteId}
            className="font-body mb-1 block text-[0.6875rem] font-medium"
            style={{ color: 'var(--card-ink-muted)' }}
          >
            Note
          </label>
          <textarea
            id={noteId}
            rows={2}
            value={clue.note ?? ''}
            onChange={(event) => onUpdateNote(clue.id, event.target.value)}
            placeholder="Add a note about this clue..."
            className="os-focus-ring font-body w-full resize-y border px-2 py-1.5 text-[0.75rem]"
            style={{
              backgroundColor: 'var(--card-paper-locked)',
              borderColor: 'var(--bevel-dark)',
              color: 'var(--card-ink)',
            }}
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          {confirmingDelete ? (
            <>
              <span
                className="font-body text-[0.6875rem]"
                style={{ color: 'var(--card-ink)' }}
              >
                Remove this clue?
              </span>
              <button
                type="button"
                onClick={() => onDelete(clue.id)}
                className="os-focus-ring font-chrome cursor-pointer border px-2.5 py-1 text-[0.6875rem] font-semibold"
                style={{
                  backgroundColor: 'var(--color-magenta)',
                  borderColor: 'var(--bevel-dark)',
                  color: '#000000',
                }}
              >
                Confirm delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="os-focus-ring font-chrome cursor-pointer border px-2.5 py-1 text-[0.6875rem]"
                style={{
                  backgroundColor: 'var(--card-paper-locked)',
                  borderColor: 'var(--bevel-dark)',
                  color: 'var(--card-ink)',
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              aria-label={`Delete clue ${clue.text}`}
              onClick={() => setConfirmingDelete(true)}
              className="os-focus-ring font-body inline-flex cursor-pointer items-center gap-1 border px-2 py-1 text-[0.6875rem]"
              style={{
                backgroundColor: 'var(--card-paper-locked)',
                borderColor: 'var(--bevel-dark)',
                color: 'var(--card-ink)',
              }}
            >
              <Trash2 size={12} aria-hidden="true" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
