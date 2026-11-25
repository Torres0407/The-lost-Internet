import { useRef, type KeyboardEvent } from 'react';
import { emitShellEvent } from '../events/eventBus';
import { useDesktopStore } from '../state/desktopStore';
import { useWindowsStore } from '../state/windowsStore';
import { DESKTOP_ICONS } from './desktopIcons';
import { DesktopIcon } from './DesktopIcon';
import type { DesktopAppId } from './types';

export function DesktopGrid() {
  const selectedIconId = useDesktopStore((state) => state.selectedIconId);
  const lastActivatedIconId = useDesktopStore((state) => state.lastActivatedIconId);
  const selectIcon = useDesktopStore((state) => state.selectIcon);
  const activateIcon = useDesktopStore((state) => state.activateIcon);
  const clearSelection = useDesktopStore((state) => state.clearSelection);
  const openWindow = useWindowsStore((state) => state.openWindow);

  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleSelect = (id: DesktopAppId) => {
    selectIcon(id);
    emitShellEvent({ type: 'desktop/icon-selected', iconId: id });
  };

  const handleActivate = (id: DesktopAppId) => {
    activateIcon(id);
    openWindow(id);
    emitShellEvent({ type: 'desktop/icon-activated', iconId: id });
  };

  const moveFocus = (nextIndex: number) => {
    const clamped = (nextIndex + DESKTOP_ICONS.length) % DESKTOP_ICONS.length;
    const targetButton = itemRefs.current[clamped];
    const targetItem = DESKTOP_ICONS[clamped];
    if (targetButton && targetItem) {
      targetButton.focus();
      handleSelect(targetItem.id);
    }
  };

  const handleIconKeyDown = (index: number) => (event: KeyboardEvent<HTMLButtonElement>) => {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        moveFocus(index + 1);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        moveFocus(index - 1);
        break;
      case 'Home':
        event.preventDefault();
        moveFocus(0);
        break;
      case 'End':
        event.preventDefault();
        moveFocus(DESKTOP_ICONS.length - 1);
        break;
      case 'Escape':
        event.preventDefault();
        clearSelection();
        emitShellEvent({ type: 'desktop/icon-selected', iconId: null });
        break;
      default:
        break;
    }
  };

  return (
    <nav
      id="desktop-icons"
      tabIndex={-1}
      aria-label="Desktop applications"
      className="relative z-10 flex-1 overflow-y-auto p-5 outline-none sm:p-7"
    >
      <div className="grid max-w-[340px] grid-cols-2 gap-3 sm:max-w-[240px] sm:grid-flow-col sm:grid-cols-2 sm:grid-rows-4 sm:gap-3.5">
        {DESKTOP_ICONS.map((item, index) => (
          <DesktopIcon
            key={item.id}
            item={item}
            isSelected={selectedIconId === item.id}
            isActivated={lastActivatedIconId === item.id}
            buttonRef={(el) => {
              itemRefs.current[index] = el;
            }}
            onSelect={() => handleSelect(item.id)}
            onActivate={() => handleActivate(item.id)}
            onKeyDown={handleIconKeyDown(index)}
          />
        ))}
      </div>
    </nav>
  );
}
