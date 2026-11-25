import { useRef, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { motion } from 'motion/react';
import { PixelIcon } from '../ui/PixelIcon';
import type { DesktopIconItem } from './types';

interface DesktopIconProps {
  item: DesktopIconItem;
  isSelected: boolean;
  isActivated: boolean;
  buttonRef: (el: HTMLButtonElement | null) => void;
  onSelect: () => void;
  onActivate: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}

export function DesktopIcon({
  item,
  isSelected,
  isActivated,
  buttonRef,
  onSelect,
  onActivate,
  onKeyDown,
}: DesktopIconProps) {
  const lastPointerTypeRef = useRef<string>('mouse');

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    lastPointerTypeRef.current = event.pointerType || 'mouse';
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (event.detail === 0 || lastPointerTypeRef.current === 'touch') {
      onActivate();
      return;
    }
    onSelect();
  };

  const handleDoubleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onActivate();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      onActivate();
      return;
    }
    onKeyDown(event);
  };

  return (
    <motion.button
      ref={buttonRef}
      type="button"
      data-desktop-icon={item.id}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      aria-label={`${item.label}. ${item.description}`}
      aria-pressed={isSelected}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
      className="os-focus-ring group flex min-h-[6rem] min-w-[4rem] w-[6.5rem] cursor-pointer flex-col items-center justify-start gap-2 rounded-[2px] border px-2 py-2.5 text-center select-none max-lg:min-h-[5.5rem] max-lg:min-w-[4.5rem]"
      style={{
        backgroundColor: isSelected ? 'var(--selection-fill)' : 'transparent',
        borderColor: isSelected
          ? isActivated
            ? 'var(--color-amber)'
            : 'var(--selection-border)'
          : 'transparent',
      }}
    >
      <span className="flex h-11 w-11 items-center justify-center">
        <PixelIcon id={item.id} size={40} />
      </span>
      <span
        className="font-chrome w-full text-[0.8125rem] leading-[1.2] tracking-[0.02em] break-words"
        style={{
          color: isSelected ? 'var(--color-phosphor)' : 'var(--color-paper)',
          textShadow: '0 1px 2px rgba(11, 20, 24, 0.95)',
        }}
      >
        {item.label}
      </span>
    </motion.button>
  );
}
