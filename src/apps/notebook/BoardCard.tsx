import {
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Link2 } from 'lucide-react';
import type { Clue } from '../../engine/notebook';

export const BOARD_CARD_WIDTH = 208;
export const BOARD_CARD_HEIGHT = 112;

interface BoardCardProps {
  clue: Clue;
  index: number;
  otherClues: Clue[];
  isDropTarget: boolean;
  isConnectingSource: boolean;
  hasLinkWith: (otherId: string) => boolean;
  onMove: (id: string, x: number, y: number) => void;
  onStartConnect: (
    clueId: string,
    clientX: number,
    clientY: number,
    pointerId: number
  ) => void;
  onCreateLink: (fromId: string, toId: string) => void;
}

interface CardDragState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  originX: number;
  originY: number;
}

export function BoardCard({
  clue,
  index,
  otherClues,
  isDropTarget,
  isConnectingSource,
  hasLinkWith,
  onMove,
  onStartConnect,
  onCreateLink,
}: BoardCardProps) {
  const [linkPickerOpen, setLinkPickerOpen] = useState(false);
  const dragRef = useRef<CardDragState | null>(null);
  const tiltClass =
    index % 2 === 0 ? 'notebook-card-tilt-even' : 'notebook-card-tilt-odd';

  const handleCardPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0 && event.pointerType === 'mouse') {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target?.closest('button') || target?.closest('[data-link-picker="true"]')) {
      return;
    }

    event.stopPropagation();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);

    dragRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: clue.x,
      originY: clue.y,
    };
  };

  const handleCardPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    const dx = event.clientX - drag.startClientX;
    const dy = event.clientY - drag.startClientY;
    onMove(clue.id, drag.originX + dx, drag.originY + dy);
  };

  const handleCardPointerEnd = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (drag && drag.pointerId === event.pointerId) {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      dragRef.current = null;
    }
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const target = event.target as HTMLElement | null;
    if (target !== event.currentTarget) {
      return;
    }

    const step = event.shiftKey ? 24 : 8;
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        onMove(clue.id, clue.x - step, clue.y);
        break;
      case 'ArrowRight':
        event.preventDefault();
        onMove(clue.id, clue.x + step, clue.y);
        break;
      case 'ArrowUp':
        event.preventDefault();
        onMove(clue.id, clue.x, clue.y - step);
        break;
      case 'ArrowDown':
        event.preventDefault();
        onMove(clue.id, clue.x, clue.y + step);
        break;
      case 'Enter':
        event.preventDefault();
        setLinkPickerOpen((prev) => !prev);
        break;
      case 'Escape':
        if (linkPickerOpen) {
          event.stopPropagation();
          setLinkPickerOpen(false);
        }
        break;
      default:
        break;
    }
  };

  return (
    <article
      data-board-card-id={clue.id}
      tabIndex={0}
      aria-label={`Clue card: ${clue.text} from ${clue.sourceTitle}. Use arrow keys to move, Enter to link.`}
      onPointerDown={handleCardPointerDown}
      onPointerMove={handleCardPointerMove}
      onPointerUp={handleCardPointerEnd}
      onPointerCancel={handleCardPointerEnd}
      onKeyDown={handleCardKeyDown}
      className={`${tiltClass} os-focus-ring absolute flex touch-none flex-col justify-between border-2 p-2.5 shadow-md select-none`}
      style={{
        left: clue.x,
        top: clue.y,
        width: BOARD_CARD_WIDTH,
        minHeight: BOARD_CARD_HEIGHT,
        backgroundColor: 'var(--card-paper)',
        color: 'var(--card-ink)',
        borderColor: isDropTarget
          ? 'var(--color-phosphor)'
          : isConnectingSource
            ? 'var(--color-amber)'
            : 'var(--bevel-light)',
        cursor: 'grab',
        zIndex: linkPickerOpen ? 25 : 10,
      }}
    >
      <div
        className="mb-1.5 flex items-center justify-between gap-2 border-b pb-1"
        style={{ borderBottomColor: 'var(--border-subtle)' }}
      >
        <span
          className="font-body truncate text-[0.625rem] font-semibold"
          style={{ color: 'var(--card-ink-muted)' }}
        >
          {clue.sourceTitle}
        </span>

        {/* Pointer drag-to-connect handle */}
        <button
          type="button"
          data-connect-handle="true"
          aria-label={`Drag handle to connect ${clue.text}`}
          title="Drag onto another card to link"
          onPointerDown={(event) => {
            event.stopPropagation();
            onStartConnect(clue.id, event.clientX, event.clientY, event.pointerId);
          }}
          className="os-focus-ring flex h-6 w-6 shrink-0 touch-none cursor-crosshair items-center justify-center rounded-full border max-lg:h-9 max-lg:w-9"
          style={{
            borderColor: 'var(--card-ink)',
            backgroundColor: 'var(--color-phosphor)',
            color: 'var(--card-ink)',
          }}
        >
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: '#0b1418' }}
          />
        </button>
      </div>

      <p
        className="font-body line-clamp-3 text-[0.75rem] leading-snug font-medium"
        style={{ color: 'var(--card-ink)' }}
      >
        {clue.text}
      </p>

      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setLinkPickerOpen((prev) => !prev);
          }}
          aria-expanded={linkPickerOpen}
          className="os-bevel-raised os-focus-ring font-chrome inline-flex cursor-pointer items-center gap-1 border px-2 py-0.5 text-[0.6875rem]"
          style={{
            backgroundColor: 'var(--color-panel-elevated)',
            borderColor: 'var(--bevel-light)',
            color: 'var(--color-paper)',
          }}
        >
          <Link2 size={11} aria-hidden="true" />
          <span>Link to...</span>
        </button>
      </div>

      {linkPickerOpen && (
        <div
          data-link-picker="true"
          onPointerDown={(event) => event.stopPropagation()}
          className="os-bevel-raised absolute top-full left-0 z-30 mt-1 w-full p-1.5 shadow-xl"
          style={{ backgroundColor: 'var(--color-panel)' }}
        >
          <p
            className="font-chrome mb-1 px-1 text-[11px]"
            style={{ color: 'var(--color-amber)' }}
          >
            Connect to:
          </p>
          {otherClues.length === 0 ? (
            <p
              className="font-body px-1 py-1 text-[11px]"
              style={{ color: 'var(--color-paper-muted)' }}
            >
              No other clues on board yet.
            </p>
          ) : (
            <ul className="max-h-36 space-y-1 overflow-y-auto">
              {otherClues.map((other) => {
                const alreadyLinked = hasLinkWith(other.id);
                return (
                  <li key={other.id}>
                    <button
                      type="button"
                      disabled={alreadyLinked}
                      onClick={() => {
                        onCreateLink(clue.id, other.id);
                        setLinkPickerOpen(false);
                      }}
                      className="os-focus-ring font-body w-full cursor-pointer px-2 py-1 text-left text-[11px] hover:bg-[#25484e] disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ color: 'var(--color-paper)' }}
                    >
                      <span className="block truncate">{other.text}</span>
                      {alreadyLinked && (
                        <span
                          className="font-chrome text-[10px]"
                          style={{ color: 'var(--color-phosphor)' }}
                        >
                          Already linked
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </article>
  );
}
