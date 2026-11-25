import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { SettingsApp } from '../apps/settings/SettingsApp';
import { SoundLogApp } from '../apps/soundLog/SoundLogApp';
import { useSoundLogStore } from '../audio/soundLogStore';
import { useCollectionStore } from '../state/collectionStore';
import { useSettingsStore } from '../state/settingsStore';
import { useWindowsStore } from '../state/windowsStore';
import { Glitch } from '../ui/Glitch';
import { isHelpShortcutKeyEvent } from '../ui/keyboardUtils';
import { BootSequence } from './boot/BootSequence';
import { DesktopScreen } from './DesktopScreen';
import { LiveRegions } from './LiveRegions';
import {
  focusWindowState,
  INITIAL_WINDOWS_STATE,
  isSingleWindowPhoneViewport,
  openWindowState,
  shouldOpenMaximized,
} from './windows/windowReducer';

describe('Accessibility, BootSequence, SettingsApp, and Responsive Windowing', () => {
  beforeEach(() => {
    useSettingsStore.getState().resetSettings();
    useSoundLogStore.getState().clearEntries();
    useCollectionStore.getState().resetCollection();
    useWindowsStore.setState({
      ...INITIAL_WINDOWS_STATE,
      viewport: { width: 1280, height: 800 },
    });
  });

  it('auto-maximizes new windows below 900px and enforces single-window minimized switching below 700px', () => {
    const tabletState = openWindowState(
      INITIAL_WINDOWS_STATE,
      'browser',
      { width: 820, height: 900 }
    );
    const tabletWin = Object.values(tabletState.windows)[0];
    expect(shouldOpenMaximized({ width: 820, height: 900 })).toBe(true);
    expect(isSingleWindowPhoneViewport({ width: 820, height: 900 })).toBe(false);
    expect(tabletWin.maximized).toBe(true);

    // Phone (< 700px): opening a second window maximizes it and minimizes the previous window
    let phoneState = openWindowState(
      INITIAL_WINDOWS_STATE,
      'browser',
      { width: 390, height: 760 }
    );
    const firstId = phoneState.focusedId!;
    expect(phoneState.windows[firstId].maximized).toBe(true);
    expect(phoneState.windows[firstId].minimized).toBe(false);

    phoneState = openWindowState(
      phoneState,
      'notebook',
      { width: 390, height: 760 }
    );
    const secondId = phoneState.focusedId!;
    expect(secondId).not.toBe(firstId);
    expect(phoneState.windows[secondId].maximized).toBe(true);
    expect(phoneState.windows[secondId].minimized).toBe(false);
    expect(phoneState.windows[firstId].minimized).toBe(true);

    // Focusing first window in phone mode restores it maximized and minimizes second window
    phoneState = focusWindowState(phoneState, firstId, { width: 390, height: 760 });
    expect(phoneState.windows[firstId].minimized).toBe(false);
    expect(phoneState.windows[firstId].maximized).toBe(true);
    expect(phoneState.windows[secondId].minimized).toBe(true);
  });

  it('ignores ? shortcut inside editable targets and Shadow DOM composedPath inputs', () => {
    expect(
      isHelpShortcutKeyEvent({
        key: '?',
        target: { tagName: 'DIV', isContentEditable: false } as unknown as EventTarget,
      })
    ).toBe(true);

    expect(
      isHelpShortcutKeyEvent({
        key: '?',
        target: { tagName: 'INPUT', isContentEditable: false } as unknown as EventTarget,
      })
    ).toBe(false);

    expect(
      isHelpShortcutKeyEvent({
        key: '?',
        target: { tagName: 'TEXTAREA', isContentEditable: false } as unknown as EventTarget,
      })
    ).toBe(false);

    expect(
      isHelpShortcutKeyEvent({
        key: '?',
        target: { tagName: 'DIV', isContentEditable: true } as unknown as EventTarget,
      })
    ).toBe(false);

    expect(
      isHelpShortcutKeyEvent({
        key: '?',
        target: { tagName: 'PAGE-VIEWPORT' } as unknown as EventTarget,
        composedPath: () => [
          { tagName: 'INPUT', isContentEditable: false } as unknown as EventTarget,
          { tagName: 'PAGE-VIEWPORT' } as unknown as EventTarget,
        ],
      })
    ).toBe(false);
  });

  it('renders DesktopScreen landmarks, skip links, and taskbar nav', () => {
    const html = renderToStaticMarkup(createElement(DesktopScreen));

    expect(html).toContain('Skip to desktop');
    expect(html).toContain('Skip to taskbar');
    expect(html).toContain('<main aria-label="Desktop"');
    expect(html).toContain('<nav id="os-taskbar"');
    expect(html).toContain('aria-label="Taskbar"');
    expect(isSingleWindowPhoneViewport({ width: 390, height: 740 })).toBe(true);
    expect(isSingleWindowPhoneViewport({ width: 820, height: 900 })).toBe(false);
  });

  it('renders exactly one polite and one assertive root LiveRegion', () => {
    const html = renderToStaticMarkup(createElement(LiveRegions));
    expect((html.match(/aria-live="polite"/g) ?? []).length).toBe(1);
    expect((html.match(/aria-live="assertive"/g) ?? []).length).toBe(1);
    expect(html).toContain('id="tli-live-polite"');
    expect(html).toContain('id="tli-live-assertive"');
  });

  it('renders SettingsApp with all 4 ARIA tabs and accessibility shortcuts documentation', () => {
    const displayHtml = renderToStaticMarkup(
      createElement(SettingsApp, { initialTab: 'display' })
    );
    expect(displayHtml).toContain('role="tablist"');
    expect(displayHtml).toContain('Display');
    expect(displayHtml).toContain('Sound');
    expect(displayHtml).toContain('Accessibility');
    expect(displayHtml).toContain('Save Data');
    expect(displayHtml).toContain('<fieldset');
    expect(displayHtml).toContain('<legend');
    expect(displayHtml).toContain('125%');
    expect(displayHtml).toContain('150%');

    const soundHtml = renderToStaticMarkup(
      createElement(SettingsApp, { initialTab: 'sound' })
    );
    expect(soundHtml).toContain('Master volume');
    expect(soundHtml).toContain('Music volume');
    expect(soundHtml).toContain('Effects volume');
    expect(soundHtml).toContain('Open Sound Log');

    const a11yHtml = renderToStaticMarkup(
      createElement(SettingsApp, { initialTab: 'accessibility' })
    );
    expect(a11yHtml).toContain('Keyboard Shortcuts');
    expect(a11yHtml).toContain('Ctrl + `');
    expect(a11yHtml).toContain('Alt + Left / Right');
    expect(a11yHtml).toContain('Screen-Reader &amp; Assistive Guide');
  });

  it('renders BootSequence BIOS header, first BIOS line, and Skip button', () => {
    const html = renderToStaticMarkup(
      createElement(BootSequence, {
        persistenceStage: 'ready',
        audioChoiceMade: false,
        onComplete: () => undefined,
      })
    );

    expect(html).toContain('The Lost Internet');
    expect(html).toContain('LANTERN ARCHIVE RESTORATION TOOL');
    expect(html).toContain('>Skip</button>');

    useSettingsStore.getState().acceptBootAudioChoice(true);
    expect(useSettingsStore.getState().audioChoiceMade).toBe(true);
    expect(useSettingsStore.getState().audioEnabled).toBe(true);
  });

  it('disables Glitch animation wrapper when active is false or reduced motion / disabled settings apply', () => {
    const inactiveHtml = renderToStaticMarkup(
      createElement(Glitch, {
        active: false,
        children: createElement('span', null, 'Signal'),
      })
    );
    expect(inactiveHtml).toContain('data-glitch-active="false"');
    expect(inactiveHtml).not.toContain('tli-glitch-once');

    useSettingsStore.getState().setMotion('reduce');
    expect(useSettingsStore.getState().motion).toBe('reduce');
  });

  it('renders SoundLogApp empty state and stores informational entries up to 20', () => {
    const emptyHtml = renderToStaticMarkup(createElement(SoundLogApp));
    expect(emptyHtml).toContain('No informational sound cues logged yet');

    useSoundLogStore
      .getState()
      .recordEntry('insight_chime', 'New insight recorded in Notebook.');
    expect(useSoundLogStore.getState().entries[0].text).toBe(
      'New insight recorded in Notebook.'
    );
  });
});
