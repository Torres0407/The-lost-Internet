import type { UnlockedInsight } from '../../state/notebookStore';

interface InsightPanelProps {
  insight: UnlockedInsight;
  onDismiss: () => void;
}

export function InsightPanel({ insight, onDismiss }: InsightPanelProps) {
  return (
    <section
      aria-label={`Insight: ${insight.title}`}
      className="os-bevel-raised absolute right-3 bottom-3 left-3 z-30 border p-3 shadow-xl sm:left-auto sm:w-[340px]"
      style={{
        backgroundColor: 'var(--color-panel)',
        borderColor: 'var(--color-amber)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p
            className="font-chrome text-[11px] font-semibold"
            style={{ color: 'var(--color-amber)' }}
          >
            Insight unlocked
          </p>
          <h3
            className="font-chrome text-[15px] font-semibold"
            style={{ color: 'var(--color-phosphor)' }}
          >
            {insight.title}
          </h3>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss insight"
          className="os-bevel-raised os-focus-ring font-chrome cursor-pointer px-2 py-0.5 text-[11px]"
          style={{ color: 'var(--color-paper)' }}
        >
          OK
        </button>
      </div>
      <p
        className="font-body mt-2 text-[13px] leading-relaxed"
        style={{ color: 'var(--color-paper)' }}
      >
        {insight.text}
      </p>
    </section>
  );
}
