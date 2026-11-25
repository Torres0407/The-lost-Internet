import { useCallback, useEffect, useRef, useState } from 'react';
import { audioEngine } from '../../audio/audioEngine';
import { emitShellEvent } from '../../events/eventBus';
import type { BootStage } from '../../state/persistence/persistenceController';
import {
  selectResolvedMotion,
  useSettingsStore,
} from '../../state/settingsStore';
import { Glitch } from '../../ui/Glitch';

export const BIOS_LINES: readonly string[] = [
  'LANTERN ARCHIVE RESTORATION TOOL · REV 2.04',
  'CPU: MERIDIAN-486DX2 / 66MHz · MEM: 32768K OK',
  'MOUNTING SNAPSHOT VOLUME: /dev/meridian-ring0 ... OK',
  'INDEXED CACHE VOLATILITY CHECK · GUARD ACTIVE',
  'VERIFYING MERIDIAN RING CHECKSUMS (40 NODES) ... PARTIAL',
  'SIGNAL FRAGMENT DETECTED ON SECTOR 11-09 [HALCYON]',
];

export interface BootSequenceProps {
  persistenceStage: BootStage;
  audioChoiceMade: boolean;
  onComplete: () => void;
}

export function BootSequence({
  persistenceStage,
  audioChoiceMade,
  onComplete,
}: BootSequenceProps) {
  const resolvedMotion = useSettingsStore(selectResolvedMotion);
  const acceptBootAudioChoice = useSettingsStore(
    (state) => state.acceptBootAudioChoice
  );

  const isReducedMotion = resolvedMotion === 'reduced';
  const [visibleLines, setVisibleLines] = useState<number>(() =>
    isReducedMotion ? BIOS_LINES.length : 1
  );
  const [biosDone, setBiosDone] = useState<boolean>(isReducedMotion);
  const [skippedToFinish, setSkippedToFinish] = useState<boolean>(false);
  const [fadingOut, setFadingOut] = useState<boolean>(false);

  const skipButtonRef = useRef<HTMLButtonElement | null>(null);
  const noSoundButtonRef = useRef<HTMLButtonElement | null>(null);
  const finishedRef = useRef(false);

  const awaitingAudioChoice = !audioChoiceMade;
  const needsAudioPrompt = awaitingAudioChoice && biosDone;

  // Announce boot start via root live region
  useEffect(() => {
    emitShellEvent({
      type: 'os/announce',
      message: 'Starting Lantern Archive Restoration Tool',
    });
  }, []);

  // Initial focus management: Skip button during BIOS, 'No, stay silent' during audio prompt
  useEffect(() => {
    if (needsAudioPrompt) {
      const raf = window.requestAnimationFrame(() => {
        noSoundButtonRef.current?.focus();
      });
      return () => window.cancelAnimationFrame(raf);
    }
    skipButtonRef.current?.focus();
    return undefined;
  }, [needsAudioPrompt]);

  // Line-by-line BIOS reveal: ~4s first visit, ~1.5s returning visit, instant on reduced motion
  useEffect(() => {
    if (biosDone || isReducedMotion) {
      setVisibleLines(BIOS_LINES.length);
      setBiosDone(true);
      return;
    }

    const totalMs = awaitingAudioChoice ? 3900 : 1450;
    const stepMs = Math.max(120, Math.floor(totalMs / BIOS_LINES.length));

    const timer = window.setInterval(() => {
      setVisibleLines((prev) => {
        const next = prev + 1;
        if (next >= BIOS_LINES.length) {
          window.clearInterval(timer);
          setBiosDone(true);
          return BIOS_LINES.length;
        }
        return next;
      });
    }, stepMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [awaitingAudioChoice, biosDone, isReducedMotion]);

  const beginFadeAndComplete = useCallback(() => {
    if (finishedRef.current) {
      return;
    }
    finishedRef.current = true;
    setFadingOut(true);
    const fadeDelay = isReducedMotion ? 50 : 150;
    window.setTimeout(() => {
      emitShellEvent({ type: 'os/announce', message: 'Ready' });
      onComplete();
    }, fadeDelay);
  }, [isReducedMotion, onComplete]);

  // Returning visit auto-completes once BIOS + persistence loading both finish
  useEffect(() => {
    if (awaitingAudioChoice) {
      return;
    }
    if (!biosDone && !skippedToFinish) {
      return;
    }
    if (persistenceStage === 'loading') {
      return;
    }
    beginFadeAndComplete();
  }, [
    awaitingAudioChoice,
    beginFadeAndComplete,
    biosDone,
    persistenceStage,
    skippedToFinish,
  ]);

  const handleSkip = useCallback(() => {
    if (awaitingAudioChoice) {
      setVisibleLines(BIOS_LINES.length);
      setBiosDone(true);
      return;
    }
    setVisibleLines(BIOS_LINES.length);
    setBiosDone(true);
    setSkippedToFinish(true);
  }, [awaitingAudioChoice]);

  // Any key or pointer click during BIOS skips straight ahead (ignored once sound prompt is up)
  useEffect(() => {
    if (needsAudioPrompt) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (event.key === 'Tab') {
        return;
      }
      event.preventDefault();
      handleSkip();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSkip, needsAudioPrompt]);

  const handleEnableSound = () => {
    acceptBootAudioChoice(true);
    audioEngine.unlockFromUserGesture();
    audioEngine.playSound('window_open');
    if (persistenceStage !== 'loading') {
      beginFadeAndComplete();
    } else {
      setSkippedToFinish(true);
    }
  };

  const handleStaySilent = () => {
    acceptBootAudioChoice(false);
    if (persistenceStage !== 'loading') {
      beginFadeAndComplete();
    } else {
      setSkippedToFinish(true);
    }
  };

  const shownLines = BIOS_LINES.slice(0, visibleLines);
  const fadeDurationMs = isReducedMotion ? 50 : 140;

  return (
    <main
      data-os-root="true"
      aria-label="Boot sequence"
      onClick={() => {
        if (!needsAudioPrompt) {
          handleSkip();
        }
      }}
      className="relative flex h-dvh w-screen items-center justify-center p-4 sm:p-6"
      style={{
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-paper)',
        opacity: fadingOut ? 0 : 1,
        transition: `opacity ${fadeDurationMs}ms ease-out`,
      }}
    >
      <section
        onClick={(event) => event.stopPropagation()}
        className="os-bevel-raised w-full max-w-[34rem] p-5 shadow-2xl sm:p-6"
        style={{ backgroundColor: 'var(--color-panel)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p
            className="font-mono-tabular text-[0.75rem] tracking-[0.04em]"
            style={{ color: 'var(--color-amber)' }}
          >
            MERIDIAN ARCHIVE WORKSTATION
          </p>

          {!needsAudioPrompt && (
            <button
              ref={skipButtonRef}
              type="button"
              onClick={handleSkip}
              className="os-bevel-raised os-focus-ring font-chrome h-8 min-w-[4.5rem] cursor-pointer px-3 text-[0.8125rem] whitespace-nowrap"
              style={{
                backgroundColor: 'var(--color-panel-elevated)',
                color: 'var(--color-paper)',
              }}
            >
              Skip
            </button>
          )}
        </div>

        <h1
          className="font-chrome mt-2 text-[1.625rem] font-bold tracking-[0.02em]"
          style={{ color: 'var(--color-phosphor)' }}
        >
          The Lost Internet
        </h1>

        <div
          className="os-bevel-sunken mt-4 space-y-1.5 p-3.5"
          style={{ backgroundColor: 'var(--color-bg)' }}
        >
          {shownLines.map((line, index) => {
            const isLastLine = index === BIOS_LINES.length - 1;
            const lineContent = (
              <p
                className="font-mono-tabular text-[0.75rem] leading-relaxed"
                style={{
                  color: isLastLine
                    ? 'var(--color-amber)'
                    : 'var(--color-phosphor)',
                }}
              >
                {line}
              </p>
            );

            return isLastLine ? (
              <Glitch key={line} triggerKey={visibleLines}>
                {lineContent}
              </Glitch>
            ) : (
              <div key={line}>{lineContent}</div>
            );
          })}

          {persistenceStage === 'loading' && (
            <p
              className="font-mono-tabular pt-1 text-[0.75rem]"
              style={{ color: 'var(--color-paper-muted)' }}
            >
              Restoring saved session from browser storage...
            </p>
          )}

          {persistenceStage === 'boot-prompt' && (
            <p
              className="font-body pt-1 text-[0.8125rem]"
              style={{ color: 'var(--color-paper)' }}
            >
              Local session cleared. Ready to begin a fresh archive recovery.
            </p>
          )}
        </div>

        {needsAudioPrompt ? (
          <div
            role="group"
            aria-labelledby="boot-audio-question"
            className="os-bevel-sunken mt-4 space-y-3 p-4"
            style={{ backgroundColor: 'var(--color-panel-deep)' }}
          >
            <p
              id="boot-audio-question"
              className="font-chrome text-[1rem] font-semibold"
              style={{ color: 'var(--color-paper)' }}
            >
              Play with sound?
            </p>
            <p
              className="font-body text-[0.8125rem] leading-snug"
              style={{ color: 'var(--color-paper-muted)' }}
            >
              Includes optional dial-up modem tones, interface clicks, and gentle MIDI site
              loops. Every informational cue is also logged in text.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                ref={noSoundButtonRef}
                type="button"
                onClick={handleStaySilent}
                className="os-bevel-raised os-focus-ring font-chrome h-10 cursor-pointer px-4 text-[0.875rem] font-semibold whitespace-nowrap"
                style={{
                  backgroundColor: 'var(--color-panel-elevated)',
                  color: 'var(--color-paper)',
                }}
              >
                No, stay silent
              </button>
              <button
                type="button"
                onClick={handleEnableSound}
                className="os-bevel-raised os-focus-ring font-chrome h-10 cursor-pointer px-4 text-[0.875rem] font-semibold whitespace-nowrap"
                style={{
                  backgroundColor: 'var(--color-panel-elevated)',
                  color: 'var(--color-phosphor)',
                }}
              >
                Yes, enable sound
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between gap-2">
            <p
              className="font-mono-tabular text-[0.75rem]"
              style={{ color: 'var(--color-paper-muted)' }}
            >
              {biosDone && persistenceStage === 'loading'
                ? 'Waiting for archive storage...'
                : 'Press any key, click, or Skip to continue.'}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
