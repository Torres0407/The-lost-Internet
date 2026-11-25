import { useId, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { Clue } from '../../engine/notebook';
import { ClueCard } from './ClueCard';

interface CluesTabProps {
  clues: Clue[];
  onOpenSourceUrl: (url: string) => void;
  onUpdateNote: (id: string, note: string) => void;
  onDeleteClue: (id: string) => void;
}

export function CluesTab({
  clues,
  onOpenSourceUrl,
  onUpdateNote,
  onDeleteClue,
}: CluesTabProps) {
  const [query, setQuery] = useState('');
  const searchInputId = useId();

  const filteredClues = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...clues].sort((a, b) => b.savedAt - a.savedAt);
    if (!q) {
      return sorted;
    }
    return sorted.filter(
      (clue) =>
        clue.text.toLowerCase().includes(q) ||
        clue.sourceTitle.toLowerCase().includes(q) ||
        clue.sourceUrl.toLowerCase().includes(q) ||
        (clue.note ?? '').toLowerCase().includes(q)
    );
  }, [clues, query]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className="shrink-0 border-b px-3 py-2"
        style={{
          backgroundColor: 'var(--color-panel-deep)',
          borderBottomColor: 'var(--bevel-dark)',
        }}
      >
        <label htmlFor={searchInputId} className="sr-only">
          Search clues
        </label>
        <div className="relative flex items-center">
          <Search
            size={14}
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5"
            style={{ color: 'var(--color-paper-muted)' }}
          />
          <input
            id={searchInputId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search clues, sources, or notes..."
            className="os-bevel-sunken os-focus-ring font-body h-8 w-full pr-2.5 pl-8 text-[13px]"
            style={{
              backgroundColor: 'var(--color-bg)',
              color: 'var(--color-paper)',
            }}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3.5">
        {clues.length === 0 ? (
          <div
            className="border p-4"
            style={{
              backgroundColor: 'var(--color-panel-deep)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <h3
              className="font-chrome mb-1.5 text-[14px]"
              style={{ color: 'var(--color-amber)' }}
            >
              No clues saved yet
            </h3>
            <p
              className="font-body text-[13px] leading-relaxed"
              style={{ color: 'var(--color-paper)' }}
            >
              Open the Browser, select any suspicious phrase, date, or name on a page,
              right-click the selection, and choose Save to Notebook.
            </p>
          </div>
        ) : filteredClues.length === 0 ? (
          <p
            className="font-body text-[13px]"
            style={{ color: 'var(--color-paper-muted)' }}
          >
            No clues match “{query}”.
          </p>
        ) : (
          <div className="space-y-3">
            {filteredClues.map((clue, index) => (
              <ClueCard
                key={clue.id}
                clue={clue}
                index={index}
                onOpenSourceUrl={onOpenSourceUrl}
                onUpdateNote={onUpdateNote}
                onDelete={onDeleteClue}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
