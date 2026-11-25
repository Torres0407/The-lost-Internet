import type { OverallRecoverySummary } from '../../engine/collection';

export interface RecoveryTabProps {
  summary: OverallRecoverySummary;
  onOpenSite: (url: string) => void;
}

export function RecoveryTab({ summary, onOpenSite }: RecoveryTabProps) {
  const slots = Array.from({ length: summary.ringSlots }, (_, index) => {
    const site = summary.sites[index];
    const slotNumber = String(index + 1).padStart(2, '0');

    if (site && site.recovered) {
      const pageLabel =
        site.discoveredCount === 1
          ? '1 page recovered'
          : `${site.discoveredCount} pages recovered`;

      return (
        <button
          key={site.siteId}
          type="button"
          onClick={() => onOpenSite(site.homeUrl)}
          aria-label={`Slot ${slotNumber}: ${site.name}, ${pageLabel}. Open in Browser`}
          className="os-focus-ring flex min-h-[5.125rem] cursor-pointer flex-col justify-between border-2 p-2 text-left transition-transform hover:-translate-y-0.5"
          style={{
            backgroundColor: 'var(--card-paper)',
            borderColor: 'var(--bevel-light)',
            color: 'var(--card-ink)',
          }}
        >
          <div className="flex items-center justify-between gap-1">
            <span
              className="font-mono-tabular text-[0.625rem] font-semibold"
              style={{ color: 'var(--card-ink-muted)' }}
            >
              S-{slotNumber}
            </span>
            <span
              className="font-mono-tabular border px-1 py-0.5 text-[0.625rem] font-bold"
              style={{
                backgroundColor: 'var(--color-panel-deep)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--color-phosphor)',
              }}
            >
              OK
            </span>
          </div>
          <div>
            <p className="font-chrome text-[0.75rem] leading-tight font-bold">
              {site.name}
            </p>
            <p
              className="font-body mt-0.5 text-[0.6875rem]"
              style={{ color: 'var(--card-ink-muted)' }}
            >
              {pageLabel}
            </p>
          </div>
        </button>
      );
    }

    return (
      <button
        key={`unrecovered-${slotNumber}`}
        type="button"
        disabled
        aria-label={`Slot ${slotNumber}: Not yet recovered`}
        className="flex min-h-[82px] cursor-not-allowed flex-col justify-between border border-dashed p-2 text-left"
        style={{
          backgroundColor: 'var(--color-panel-deep)',
          borderColor: 'rgba(232, 228, 216, 0.22)',
          color: 'var(--color-paper-muted)',
        }}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="font-mono-tabular text-[10px]">S-{slotNumber}</span>
          <span className="font-mono-tabular text-[10px] font-semibold">404</span>
        </div>
        <p className="font-body text-[11px] leading-snug">Not yet recovered</p>
      </button>
    );
  });

  return (
    <div className="h-full overflow-y-auto p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2
          className="font-chrome text-[14px] font-semibold"
          style={{ color: 'var(--color-paper)' }}
        >
          Meridian Ring Slot Ledger (40 Slots)
        </h2>
        <p
          className="font-body text-[12px]"
          style={{ color: 'var(--color-paper-muted)' }}
        >
          Select any recovered site card to open it in the Browser.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{slots}</div>
    </div>
  );
}
