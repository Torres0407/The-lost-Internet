import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useBrowserStore } from '../state/browserStore';

export function SourceApp() {
  const sourceViewTarget = useBrowserStore((state) => state.sourceViewTarget);
  const [copied, setCopied] = useState(false);

  if (!sourceViewTarget) {
    return (
      <div className="p-5">
        <p className="font-body text-[14px]" style={{ color: 'var(--color-paper-muted)' }}>
          Open View Source from a Browser window to inspect page HTML.
        </p>
      </div>
    );
  }

  const lines = sourceViewTarget.html.split('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sourceViewTarget.html);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-paper)' }}
    >
      <div
        className="flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2"
        style={{
          backgroundColor: 'var(--color-panel)',
          borderBottomColor: 'var(--bevel-dark)',
        }}
      >
        <div className="min-w-0">
          <p
            className="font-mono-tabular truncate text-[0.75rem]"
            style={{ color: 'var(--color-phosphor)' }}
          >
            {sourceViewTarget.url}
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy source HTML"
          className="os-bevel-raised os-focus-ring font-chrome flex h-7 shrink-0 cursor-pointer items-center gap-1.5 px-2.5 text-[0.75rem] whitespace-nowrap"
          style={{ color: copied ? 'var(--color-phosphor)' : 'var(--color-paper)' }}
        >
          {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="align-top">
                <td
                  className="font-mono-tabular w-10 pr-3 text-right text-[12px] leading-[1.5] select-none"
                  style={{ color: 'var(--color-paper-muted)' }}
                >
                  {idx + 1}
                </td>
                <td
                  className="font-mono-tabular text-[12px] leading-[1.5] whitespace-pre"
                  style={{ color: 'var(--color-paper)' }}
                >
                  {line || ' '}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
