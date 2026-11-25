import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Unlink } from 'lucide-react';
import type { Clue, Link } from '../../engine/notebook';
import type { UnlockedInsight } from '../../state/notebookStore';
import {
  BOARD_CARD_HEIGHT,
  BOARD_CARD_WIDTH,
  BoardCard,
} from './BoardCard';
import { InsightPanel } from './InsightPanel';

interface BoardTabProps {
  clues: Clue[];
  links: Link[];
  hasLink: (a: string, b: string) => boolean;
  onMoveClue: (id: string, x: number, y: number) => void;
  onCreateLink: (
    a: string,
    b: string
  ) => { link: Link | null; created: boolean; insight: UnlockedInsight | null };
  onRemoveLink: (id: string) => void;
}

interface PanState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  originPanX: number;
  originPanY: number;
}

interface ConnectDragState {
  fromClueId: string;
  pointerId: number;
  boardX: number;
  boardY: number;
  hoverClueId: string | null;
}

function getCardCenter(clue: Clue): { cx: number; cy: number } {
  return {
    cx: clue.x + BOARD_CARD_WIDTH / 2,
    cy: clue.y + BOARD_CARD_HEIGHT / 2,
  };
}

export function BoardTab({
  clues,
  links,
  hasLink,
  onMoveClue,
  onCreateLink,
  onRemoveLink,
}: BoardTabProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [activeInsight, setActiveInsight] = useState<UnlockedInsight | null>(null);
  const [connectDrag, setConnectDrag] = useState<ConnectDragState | null>(null);

  const panRef = useRef<PanState | null>(null);
  const connectRef = useRef<ConnectDragState | null>(null);
  connectRef.current = connectDrag;

  const panStateRef = useRef(pan);
  panStateRef.current = pan;

  const toBoardCoords = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
      return { x: 0, y: 0 };
    }
    return {
      x: clientX - rect.left - panStateRef.current.x,
      y: clientY - rect.top - panStateRef.current.y,
    };
  };

  const findHoveredCardId = (
    clientX: number,
    clientY: number,
    excludeId: string
  ): string | null => {
    if (typeof document.elementsFromPoint === 'function') {
      const elements = document.elementsFromPoint(clientX, clientY);
      for (const el of elements) {
        const card = el.closest<HTMLElement>('[data-board-card-id]');
        const cardId = card?.dataset.boardCardId;
        if (cardId && cardId !== excludeId) {
          return cardId;
        }
      }
    }
    return null;
  };

  const handleLinkAttempt = (fromId: string, toId: string) => {
    const result = onCreateLink(fromId, toId);
    if (result.created && result.link) {
      setSelectedLinkId(result.link.id);
      if (result.insight) {
        setActiveInsight(result.insight);
      }
    }
  };

  useEffect(() => {
    if (!connectDrag) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const current = connectRef.current;
      if (!current || current.pointerId !== event.pointerId) {
        return;
      }
      const coords = toBoardCoords(event.clientX, event.clientY);
      const hoverClueId = findHoveredCardId(
        event.clientX,
        event.clientY,
        current.fromClueId
      );
      setConnectDrag({
        ...current,
        boardX: coords.x,
        boardY: coords.y,
        hoverClueId,
      });
    };

    const handlePointerUp = (event: PointerEvent) => {
      const current = connectRef.current;
      if (!current || current.pointerId !== event.pointerId) {
        return;
      }
      const targetId = findHoveredCardId(
        event.clientX,
        event.clientY,
        current.fromClueId
      );
      setConnectDrag(null);
      if (targetId) {
        handleLinkAttempt(current.fromClueId, targetId);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(connectDrag)]);

  const handleCanvasPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    if (
      target?.closest('[data-board-card-id]') ||
      target?.closest('[data-board-link="true"]')
    ) {
      return;
    }

    setSelectedLinkId(null);
    if (event.button !== 0 && event.pointerType === 'mouse') {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    panRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originPanX: pan.x,
      originPanY: pan.y,
    };
  };

  const handleCanvasPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const p = panRef.current;
    if (!p || p.pointerId !== event.pointerId) {
      return;
    }
    setPan({
      x: Math.round(p.originPanX + (event.clientX - p.startClientX)),
      y: Math.round(p.originPanY + (event.clientY - p.startClientY)),
    });
  };

  const handleCanvasPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const p = panRef.current;
    if (p && p.pointerId === event.pointerId) {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      panRef.current = null;
    }
  };

  const handleStartConnect = (
    clueId: string,
    clientX: number,
    clientY: number,
    pointerId: number
  ) => {
    const coords = toBoardCoords(clientX, clientY);
    setConnectDrag({
      fromClueId: clueId,
      pointerId,
      boardX: coords.x,
      boardY: coords.y,
      hoverClueId: null,
    });
  };

  const selectedLink = links.find((l) => l.id === selectedLinkId) ?? null;
  const sourceConnectClue = connectDrag
    ? clues.find((c) => c.id === connectDrag.fromClueId) ?? null
    : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-1.5"
        style={{
          backgroundColor: 'var(--color-panel-deep)',
          borderBottomColor: 'var(--bevel-dark)',
        }}
      >
        <p className="font-body truncate text-[12px]" style={{ color: 'var(--color-paper-muted)' }}>
          Drag handles or press Enter on a card to link clues.
        </p>

        <div className="flex shrink-0 items-center gap-2">
          {selectedLink && (
            <button
              type="button"
              onClick={() => {
                onRemoveLink(selectedLink.id);
                setSelectedLinkId(null);
              }}
              className="os-bevel-raised os-focus-ring font-chrome inline-flex h-7 cursor-pointer items-center gap-1 px-2.5 text-[11px] whitespace-nowrap"
              style={{ color: 'var(--color-magenta)' }}
            >
              <Unlink size={12} aria-hidden="true" />
              <span>Remove link</span>
            </button>
          )}

          {(pan.x !== 0 || pan.y !== 0) && (
            <button
              type="button"
              onClick={() => setPan({ x: 0, y: 0 })}
              className="os-bevel-raised os-focus-ring font-chrome h-7 cursor-pointer px-2 text-[11px] whitespace-nowrap"
              style={{ color: 'var(--color-paper)' }}
            >
              Reset view
            </button>
          )}
        </div>
      </div>

      <div
        ref={canvasRef}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerEnd}
        onPointerCancel={handleCanvasPointerEnd}
        className="relative min-h-0 flex-1 touch-none overflow-hidden"
        style={{
          backgroundColor: 'var(--color-bg)',
          backgroundImage:
            'radial-gradient(rgba(56, 242, 176, 0.16) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundPosition: `${pan.x}px ${pan.y}px`,
          cursor: 'grab',
        }}
      >
        {clues.length === 0 ? (
          <div className="flex h-full items-center justify-center p-6 text-center">
            <p
              className="font-body max-w-xs text-[13px] leading-relaxed"
              style={{ color: 'var(--color-paper-muted)' }}
            >
              Clues you save from the Browser will appear here as cards you can arrange and connect.
            </p>
          </div>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px)`,
            }}
          >
            {/* SVG links layer */}
            <svg
              aria-label="Clue connections"
              className="pointer-events-none absolute top-0 left-0 h-[2400px] w-[2400px] overflow-visible"
            >
              {links.map((link) => {
                const clueA = clues.find((c) => c.id === link.fromClueId);
                const clueB = clues.find((c) => c.id === link.toClueId);
                if (!clueA || !clueB) {
                  return null;
                }
                const a = getCardCenter(clueA);
                const b = getCardCenter(clueB);
                const isSelected = link.id === selectedLinkId;

                const handleKey = (event: KeyboardEvent<SVGGElement>) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedLinkId(link.id);
                  } else if (
                    (event.key === 'Delete' || event.key === 'Backspace') &&
                    isSelected
                  ) {
                    event.preventDefault();
                    onRemoveLink(link.id);
                    setSelectedLinkId(null);
                  }
                };

                return (
                  <g
                    key={link.id}
                    data-board-link="true"
                    role="button"
                    tabIndex={0}
                    aria-label={`Link between ${clueA.text} and ${clueB.text}${isSelected ? ', selected' : ''}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedLinkId(link.id);
                    }}
                    onKeyDown={handleKey}
                    className="pointer-events-auto cursor-pointer outline-none"
                  >
                    <line
                      x1={a.cx}
                      y1={a.cy}
                      x2={b.cx}
                      y2={b.cy}
                      stroke="transparent"
                      strokeWidth={16}
                    />
                    <line
                      x1={a.cx}
                      y1={a.cy}
                      x2={b.cx}
                      y2={b.cy}
                      stroke={isSelected ? 'var(--color-amber)' : 'var(--color-phosphor)'}
                      strokeWidth={isSelected ? 4 : 2}
                    />
                  </g>
                );
              })}

              {connectDrag && sourceConnectClue && (
                <line
                  x1={getCardCenter(sourceConnectClue).cx}
                  y1={getCardCenter(sourceConnectClue).cy}
                  x2={connectDrag.boardX}
                  y2={connectDrag.boardY}
                  stroke="#ffb347"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                />
              )}
            </svg>

            {/* Draggable cards layer */}
            {clues.map((clue, index) => (
              <BoardCard
                key={clue.id}
                clue={clue}
                index={index}
                otherClues={clues.filter((c) => c.id !== clue.id)}
                isDropTarget={connectDrag?.hoverClueId === clue.id}
                isConnectingSource={connectDrag?.fromClueId === clue.id}
                hasLinkWith={(otherId) => hasLink(clue.id, otherId)}
                onMove={onMoveClue}
                onStartConnect={handleStartConnect}
                onCreateLink={handleLinkAttempt}
              />
            ))}
          </div>
        )}

        {activeInsight && (
          <InsightPanel
            insight={activeInsight}
            onDismiss={() => setActiveInsight(null)}
          />
        )}
      </div>
    </div>
  );
}
