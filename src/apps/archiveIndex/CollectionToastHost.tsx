import { Award, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import { emitShellEvent } from '../../events/eventBus';
import { useCollectionStore } from '../../state/collectionStore';

const TOAST_DURATION_MS = 3200;

export function CollectionToastHost() {
  const activeToast = useCollectionStore((state) => state.toastQueue[0] ?? null);
  const dismissActiveToast = useCollectionStore((state) => state.dismissActiveToast);

  useEffect(() => {
    if (!activeToast) {
      return;
    }

    emitShellEvent({
      type: 'os/announce',
      message: activeToast.message,
    });

    const timer = window.setTimeout(() => {
      dismissActiveToast();
    }, TOAST_DURATION_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeToast, dismissActiveToast]);

  return (
    <div className="pointer-events-none fixed right-4 bottom-[56px] z-40">
      <AnimatePresence mode="wait">
        {activeToast && (
          <motion.div
            key={activeToast.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.16 }}
            className="os-bevel-raised pointer-events-auto flex max-w-[320px] items-center gap-2.5 border px-3 py-2 shadow-xl"
            style={{
              backgroundColor: 'var(--color-paper)',
              borderColor: '#1d3a3f',
              color: '#0b1418',
            }}
          >
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center"
              style={{
                backgroundColor: '#13282c',
                color:
                  activeToast.kind === 'artifact'
                    ? 'var(--color-phosphor)'
                    : 'var(--color-amber)',
              }}
            >
              {activeToast.kind === 'artifact' ? (
                <Sparkles size={14} aria-hidden="true" />
              ) : (
                <Award size={14} aria-hidden="true" />
              )}
            </span>

            <p className="font-chrome min-w-0 flex-1 text-[12px] leading-snug font-bold">
              {activeToast.message}
            </p>

            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={dismissActiveToast}
              className="os-focus-ring flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center"
              style={{ color: '#1d3a3f' }}
            >
              <X size={13} aria-hidden="true" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
