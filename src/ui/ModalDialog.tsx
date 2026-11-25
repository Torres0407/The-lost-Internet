import { useEffect, useId, useRef, type ReactNode } from 'react';

export interface ModalDialogProps {
  open: boolean;
  title: string;
  onCancel: () => void;
  children: ReactNode;
  accentColor?: string;
}

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function ModalDialog({
  open,
  title,
  onCancel,
  children,
  accentColor = 'var(--color-amber)',
}: ModalDialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const frame = window.requestAnimationFrame(() => {
      const container = dialogRef.current;
      if (!container) {
        return;
      }
      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        container.focus();
      }
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onCancel();
        return;
      }

      if (event.key === 'Tab') {
        const container = dialogRef.current;
        if (!container) {
          return;
        }
        const focusables = Array.from(
          container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        );
        if (focusables.length === 0) {
          event.preventDefault();
          container.focus();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        if (event.shiftKey) {
          if (active === first || !container.contains(active)) {
            event.preventDefault();
            last.focus();
          }
        } else if (active === last || !container.contains(active)) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('keydown', handleKeyDown, true);
      const returnTarget = previousFocusRef.current;
      if (returnTarget && document.contains(returnTarget)) {
        returnTarget.focus();
      }
    };
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(11, 20, 24, 0.78)' }}
      onClick={(event) => {
        event.stopPropagation();
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="os-bevel-raised w-full max-w-[460px] p-4 shadow-2xl outline-none"
        style={{
          backgroundColor: 'var(--color-panel)',
          color: 'var(--color-paper)',
        }}
      >
        <h2
          id={titleId}
          className="font-chrome border-b pb-2 text-[16px] font-bold tracking-[0.02em]"
          style={{
            color: accentColor,
            borderBottomColor: 'var(--bevel-dark)',
          }}
        >
          {title}
        </h2>

        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}
