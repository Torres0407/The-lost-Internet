import { useEffect, useState, type ReactNode } from 'react';
import { selectResolvedMotion, useSettingsStore } from '../state/settingsStore';

export interface GlitchProps {
  /** Change this value (or mount with active=true) to trigger a single <=600ms glitch pass. */
  triggerKey?: string | number | boolean;
  active?: boolean;
  className?: string;
  children: ReactNode;
}

export function Glitch({
  triggerKey = 0,
  active = true,
  className = '',
  children,
}: GlitchProps) {
  const glitchEffects = useSettingsStore((state) => state.glitchEffects);
  const resolvedMotion = useSettingsStore(selectResolvedMotion);
  const [animating, setAnimating] = useState(false);

  const enabled = active && glitchEffects && resolvedMotion !== 'reduced';

  useEffect(() => {
    if (!enabled) {
      setAnimating(false);
      return;
    }

    setAnimating(true);
    const timer = window.setTimeout(() => {
      setAnimating(false);
    }, 500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [enabled, triggerKey]);

  return (
    <div
      data-glitch-active={animating ? 'true' : 'false'}
      className={`${animating ? 'tli-glitch-once ' : ''}${className}`.trim()}
    >
      {children}
    </div>
  );
}
