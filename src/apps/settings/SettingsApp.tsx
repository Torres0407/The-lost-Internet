import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { audioEngine } from '../../audio/audioEngine';
import type {
  ContrastSetting,
  MotionSetting,
  TextScale,
} from '../../engine/settings';
import { subscribeShellEvents } from '../../events/eventBus';
import {
  useSettingsStore,
  type SettingsTabId,
} from '../../state/settingsStore';
import { useWindowsStore } from '../../state/windowsStore';
import { SaveDataTab } from './SaveDataTab';

export const SETTINGS_TABS: ReadonlyArray<{ id: SettingsTabId; label: string }> = [
  { id: 'display', label: 'Display' },
  { id: 'sound', label: 'Sound' },
  { id: 'accessibility', label: 'Accessibility' },
  { id: 'save', label: 'Save Data' },
];

export interface SettingsAppProps {
  windowId?: string;
  initialTab?: SettingsTabId;
}

export function SettingsApp({ initialTab }: SettingsAppProps) {
  const baseId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const requestedTab = useSettingsStore((state) => state.requestedSettingsTab);
  const requestSettingsTab = useSettingsStore((state) => state.requestSettingsTab);

  const [activeTab, setActiveTab] = useState<SettingsTabId>(
    () => requestedTab ?? initialTab ?? 'display'
  );

  // Sync tab requests from global ? shortcut or shell events
  useEffect(() => {
    if (requestedTab) {
      setActiveTab(requestedTab);
      requestSettingsTab(null);
    }
  }, [requestedTab, requestSettingsTab]);

  useEffect(() => {
    return subscribeShellEvents((event) => {
      if (event.type === 'settings/open-tab') {
        setActiveTab(event.tab);
      }
    });
  }, []);

  const audioEnabled = useSettingsStore((state) => state.audioEnabled);
  const masterVolume = useSettingsStore((state) => state.masterVolume);
  const musicVolume = useSettingsStore((state) => state.musicVolume);
  const effectsVolume = useSettingsStore((state) => state.effectsVolume);
  const modemSound = useSettingsStore((state) => state.modemSound);
  const soundLogVisible = useSettingsStore((state) => state.soundLogVisible);
  const textScale = useSettingsStore((state) => state.textScale);
  const contrast = useSettingsStore((state) => state.contrast);
  const motion = useSettingsStore((state) => state.motion);
  const scanlines = useSettingsStore((state) => state.scanlines);
  const glitchEffects = useSettingsStore((state) => state.glitchEffects);

  const setAudioEnabled = useSettingsStore((state) => state.setAudioEnabled);
  const setAudioChoiceMade = useSettingsStore((state) => state.setAudioChoiceMade);
  const setMasterVolume = useSettingsStore((state) => state.setMasterVolume);
  const setMusicVolume = useSettingsStore((state) => state.setMusicVolume);
  const setEffectsVolume = useSettingsStore((state) => state.setEffectsVolume);
  const setModemSound = useSettingsStore((state) => state.setModemSound);
  const setSoundLogVisible = useSettingsStore((state) => state.setSoundLogVisible);
  const setTextScale = useSettingsStore((state) => state.setTextScale);
  const setContrast = useSettingsStore((state) => state.setContrast);
  const setMotion = useSettingsStore((state) => state.setMotion);
  const setScanlines = useSettingsStore((state) => state.setScanlines);
  const setGlitchEffects = useSettingsStore((state) => state.setGlitchEffects);

  const openWindow = useWindowsStore((state) => state.openWindow);

  const selectTab = (tabId: SettingsTabId) => {
    setActiveTab(tabId);
    audioEngine.playSound('ui_click');
  };

  const handleTabKeyDown =
    (index: number) => (event: KeyboardEvent<HTMLButtonElement>) => {
      let nextIndex: number | null = null;
      if (event.key === 'ArrowRight') {
        nextIndex = (index + 1) % SETTINGS_TABS.length;
      } else if (event.key === 'ArrowLeft') {
        nextIndex = (index - 1 + SETTINGS_TABS.length) % SETTINGS_TABS.length;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = SETTINGS_TABS.length - 1;
      }

      if (nextIndex !== null) {
        event.preventDefault();
        selectTab(SETTINGS_TABS[nextIndex].id);
        tabRefs.current[nextIndex]?.focus();
      }
    };

  const handleToggleAudio = (checked: boolean) => {
    setAudioEnabled(checked);
    setAudioChoiceMade(true);
    if (checked) {
      audioEngine.unlockFromUserGesture();
      audioEngine.playSound('ui_click');
    }
  };

  const masterId = `${baseId}-master`;
  const musicId = `${baseId}-music`;
  const effectsId = `${baseId}-effects`;
  const scanlinesId = `${baseId}-scanlines`;
  const glitchId = `${baseId}-glitch`;
  const audioId = `${baseId}-audio-enabled`;
  const modemId = `${baseId}-modem-sound`;
  const soundLogId = `${baseId}-sound-log`;

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      style={{
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-paper)',
      }}
    >
      <div
        role="tablist"
        aria-label="Settings sections"
        className="flex shrink-0 flex-wrap items-center gap-1 border-b px-2 pt-2"
        style={{
          backgroundColor: 'var(--color-panel)',
          borderBottomColor: 'var(--bevel-dark)',
        }}
      >
        {SETTINGS_TABS.map((tab, index) => {
          const isSelected = activeTab === tab.id;
          const tabDomId = `${baseId}-tab-${tab.id}`;
          const panelDomId = `${baseId}-panel-${tab.id}`;

          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              id={tabDomId}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={panelDomId}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => selectTab(tab.id)}
              onKeyDown={handleTabKeyDown(index)}
              className={`${isSelected ? 'os-bevel-sunken' : 'os-bevel-raised'} os-focus-ring font-chrome min-h-9 cursor-pointer px-3.5 text-[0.8125rem] whitespace-nowrap`}
              style={{
                color: isSelected ? 'var(--color-phosphor)' : 'var(--color-paper)',
                backgroundColor: isSelected
                  ? 'var(--color-bg)'
                  : 'var(--color-panel-elevated)',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        id={`${baseId}-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${activeTab}`}
        className="min-h-0 flex-1 overflow-y-auto p-4"
      >
        <div className="mx-auto max-w-[36rem] space-y-4">
          {activeTab === 'display' && (
            <section
              aria-labelledby={`${baseId}-display-heading`}
              className="os-bevel-raised space-y-4 p-4"
              style={{ backgroundColor: 'var(--color-panel)' }}
            >
              <h2
                id={`${baseId}-display-heading`}
                className="font-chrome border-b pb-2 text-[1.0625rem] font-bold tracking-[0.02em]"
                style={{
                  color: 'var(--color-phosphor)',
                  borderBottomColor: 'var(--bevel-dark)',
                }}
              >
                Display
              </h2>

              <fieldset className="os-bevel-sunken space-y-2 p-3">
                <legend
                  className="font-chrome px-1 text-[0.8125rem] font-semibold"
                  style={{ color: 'var(--color-amber)' }}
                >
                  Text Size
                </legend>
                <div className="flex flex-wrap gap-3">
                  {([100, 125, 150] as const satisfies readonly TextScale[]).map(
                    (scale) => (
                      <label
                        key={scale}
                        className="font-body flex cursor-pointer items-center gap-2 text-[0.875rem]"
                      >
                        <input
                          type="radio"
                          name={`${baseId}-text-scale`}
                          value={scale}
                          checked={textScale === scale}
                          onChange={() => {
                            setTextScale(scale);
                            audioEngine.playSound('ui_click');
                          }}
                          className="os-focus-ring h-4 w-4 accent-[#38f2b0]"
                        />
                        <span>{scale}%</span>
                      </label>
                    )
                  )}
                </div>
              </fieldset>

              <fieldset className="os-bevel-sunken space-y-2 p-3">
                <legend
                  className="font-chrome px-1 text-[0.8125rem] font-semibold"
                  style={{ color: 'var(--color-amber)' }}
                >
                  Contrast
                </legend>
                <div className="flex flex-wrap gap-4">
                  {(
                    [
                      { value: 'normal', label: 'Normal' },
                      { value: 'high', label: 'High contrast' },
                    ] as const satisfies ReadonlyArray<{
                      value: ContrastSetting;
                      label: string;
                    }>
                  ).map((option) => (
                    <label
                      key={option.value}
                      className="font-body flex cursor-pointer items-center gap-2 text-[0.875rem]"
                    >
                      <input
                        type="radio"
                        name={`${baseId}-contrast`}
                        value={option.value}
                        checked={contrast === option.value}
                        onChange={() => {
                          setContrast(option.value);
                          audioEngine.playSound('ui_click');
                        }}
                        className="os-focus-ring h-4 w-4 accent-[#38f2b0]"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="os-bevel-sunken space-y-2.5 p-3">
                <div className="flex items-start gap-2.5">
                  <input
                    id={scanlinesId}
                    type="checkbox"
                    checked={scanlines}
                    onChange={(event) => {
                      setScanlines(event.target.checked);
                      audioEngine.playSound('ui_click');
                    }}
                    className="os-focus-ring mt-1 h-4 w-4 shrink-0 accent-[#38f2b0]"
                  />
                  <label htmlFor={scanlinesId} className="cursor-pointer">
                    <span className="font-chrome block text-[0.875rem] font-semibold">
                      CRT scanlines
                    </span>
                    <span
                      className="font-body block text-[0.75rem]"
                      style={{ color: 'var(--color-paper-muted)' }}
                    >
                      Adds a subtle non-animated scanline texture to desktop frames only.
                    </span>
                  </label>
                </div>

                <div className="flex items-start gap-2.5">
                  <input
                    id={glitchId}
                    type="checkbox"
                    checked={glitchEffects}
                    onChange={(event) => {
                      setGlitchEffects(event.target.checked);
                      audioEngine.playSound('ui_click');
                    }}
                    className="os-focus-ring mt-1 h-4 w-4 shrink-0 accent-[#38f2b0]"
                  />
                  <label htmlFor={glitchId} className="cursor-pointer">
                    <span className="font-chrome block text-[0.875rem] font-semibold">
                      Screen glitch effects
                    </span>
                    <span
                      className="font-body block text-[0.75rem]"
                      style={{ color: 'var(--color-paper-muted)' }}
                    >
                      Brief horizontal signal jitter on corrupted sector fragments.
                      Automatically disabled when Reduced Motion is active.
                    </span>
                  </label>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'sound' && (
            <section
              aria-labelledby={`${baseId}-sound-heading`}
              className="os-bevel-raised space-y-4 p-4"
              style={{ backgroundColor: 'var(--color-panel)' }}
            >
              <h2
                id={`${baseId}-sound-heading`}
                className="font-chrome border-b pb-2 text-[1.0625rem] font-bold tracking-[0.02em]"
                style={{
                  color: 'var(--color-phosphor)',
                  borderBottomColor: 'var(--bevel-dark)',
                }}
              >
                Sound
              </h2>

              <div className="os-bevel-sunken space-y-3 p-3">
                <div className="flex items-start gap-2.5">
                  <input
                    id={audioId}
                    type="checkbox"
                    checked={audioEnabled}
                    onChange={(event) => handleToggleAudio(event.target.checked)}
                    className="os-focus-ring mt-1 h-4 w-4 shrink-0 accent-[#38f2b0]"
                  />
                  <label htmlFor={audioId} className="cursor-pointer">
                    <span className="font-chrome block text-[0.875rem] font-semibold">
                      Enable sound
                    </span>
                    <span
                      className="font-body block text-[0.75rem]"
                      style={{ color: 'var(--color-paper-muted)' }}
                    >
                      Generated in-browser using Web Audio tones. Informational cues
                      always remain logged visually even when muted.
                    </span>
                  </label>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[0.8125rem]">
                      <label htmlFor={masterId} className="font-chrome">
                        Master volume
                      </label>
                      <span
                        className="font-mono-tabular"
                        style={{ color: 'var(--color-phosphor)' }}
                      >
                        {Math.round(masterVolume * 100)}%
                      </span>
                    </div>
                    <input
                      id={masterId}
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={Math.round(masterVolume * 100)}
                      onChange={(event) =>
                        setMasterVolume(Number(event.target.value) / 100)
                      }
                      className="os-focus-ring w-full accent-[#38f2b0]"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[0.8125rem]">
                      <label htmlFor={musicId} className="font-chrome">
                        Music volume
                      </label>
                      <span
                        className="font-mono-tabular"
                        style={{ color: 'var(--color-phosphor)' }}
                      >
                        {Math.round(musicVolume * 100)}%
                      </span>
                    </div>
                    <input
                      id={musicId}
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={Math.round(musicVolume * 100)}
                      onChange={(event) =>
                        setMusicVolume(Number(event.target.value) / 100)
                      }
                      className="os-focus-ring w-full accent-[#38f2b0]"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[0.8125rem]">
                      <label htmlFor={effectsId} className="font-chrome">
                        Effects volume
                      </label>
                      <span
                        className="font-mono-tabular"
                        style={{ color: 'var(--color-phosphor)' }}
                      >
                        {Math.round(effectsVolume * 100)}%
                      </span>
                    </div>
                    <input
                      id={effectsId}
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={Math.round(effectsVolume * 100)}
                      onChange={(event) =>
                        setEffectsVolume(Number(event.target.value) / 100)
                      }
                      className="os-focus-ring w-full accent-[#38f2b0]"
                    />
                  </div>
                </div>
              </div>

              <div className="os-bevel-sunken space-y-2.5 p-3">
                <div className="flex items-start gap-2.5">
                  <input
                    id={modemId}
                    type="checkbox"
                    checked={modemSound}
                    onChange={(event) => {
                      setModemSound(event.target.checked);
                      audioEngine.playSound('ui_click');
                    }}
                    className="os-focus-ring mt-1 h-4 w-4 shrink-0 accent-[#38f2b0]"
                  />
                  <label htmlFor={modemId} className="cursor-pointer">
                    <span className="font-chrome block text-[0.875rem] font-semibold">
                      Dial-up modem handshake
                    </span>
                    <span
                      className="font-body block text-[0.75rem]"
                      style={{ color: 'var(--color-paper-muted)' }}
                    >
                      Plays once per Browser session when connecting (click or press any
                      key to skip).
                    </span>
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      id={soundLogId}
                      type="checkbox"
                      checked={soundLogVisible}
                      onChange={(event) => {
                        setSoundLogVisible(event.target.checked);
                        audioEngine.playSound('ui_click');
                      }}
                      className="os-focus-ring h-4 w-4 accent-[#38f2b0]"
                    />
                    <label htmlFor={soundLogId} className="font-chrome cursor-pointer text-[0.8125rem]">
                      Show Sound Log button on taskbar
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      audioEngine.playSound('ui_click');
                      openWindow('sound-log');
                    }}
                    className="os-bevel-raised os-focus-ring font-chrome h-9 cursor-pointer px-3 text-[0.8125rem] whitespace-nowrap"
                    style={{
                      backgroundColor: 'var(--color-panel-elevated)',
                      color: 'var(--color-phosphor)',
                    }}
                  >
                    Open Sound Log
                  </button>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'accessibility' && (
            <section
              aria-labelledby={`${baseId}-a11y-heading`}
              className="os-bevel-raised space-y-4 p-4"
              style={{ backgroundColor: 'var(--color-panel)' }}
            >
              <h2
                id={`${baseId}-a11y-heading`}
                className="font-chrome border-b pb-2 text-[1.0625rem] font-bold tracking-[0.02em]"
                style={{
                  color: 'var(--color-phosphor)',
                  borderBottomColor: 'var(--bevel-dark)',
                }}
              >
                Accessibility
              </h2>

              <fieldset className="os-bevel-sunken space-y-2 p-3">
                <legend
                  className="font-chrome px-1 text-[0.8125rem] font-semibold"
                  style={{ color: 'var(--color-amber)' }}
                >
                  Motion
                </legend>
                <div className="flex flex-wrap gap-4">
                  {(
                    [
                      { value: 'system', label: 'Follow system' },
                      { value: 'reduce', label: 'Reduced' },
                      { value: 'full', label: 'Full' },
                    ] as const satisfies ReadonlyArray<{
                      value: MotionSetting;
                      label: string;
                    }>
                  ).map((option) => (
                    <label
                      key={option.value}
                      className="font-body flex cursor-pointer items-center gap-2 text-[0.875rem]"
                    >
                      <input
                        type="radio"
                        name={`${baseId}-motion`}
                        value={option.value}
                        checked={motion === option.value}
                        onChange={() => {
                          setMotion(option.value);
                          audioEngine.playSound('ui_click');
                        }}
                        className="os-focus-ring h-4 w-4 accent-[#38f2b0]"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="os-bevel-sunken space-y-2 p-3">
                <h3
                  className="font-chrome text-[0.875rem] font-semibold"
                  style={{ color: 'var(--color-amber)' }}
                >
                  Keyboard Shortcuts
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-[0.8125rem]">
                    <thead>
                      <tr
                        className="border-b"
                        style={{ borderBottomColor: 'var(--bevel-dark)' }}
                      >
                        <th scope="col" className="font-chrome py-1.5 pr-3">
                          Shortcut
                        </th>
                        <th scope="col" className="font-chrome py-1.5">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      <tr>
                        <th scope="row" className="font-mono-tabular py-1.5 pr-3 font-medium">
                          ?
                        </th>
                        <td className="font-body py-1.5">
                          Open Accessibility Settings &amp; Shortcuts
                        </td>
                      </tr>
                      <tr>
                        <th scope="row" className="font-mono-tabular py-1.5 pr-3 font-medium">
                          Ctrl + `
                        </th>
                        <td className="font-body py-1.5">
                          Cycle open desktop windows (Shift reverses)
                        </td>
                      </tr>
                      <tr>
                        <th scope="row" className="font-mono-tabular py-1.5 pr-3 font-medium">
                          Alt + Left / Right
                        </th>
                        <td className="font-body py-1.5">Browser Back / Forward</td>
                      </tr>
                      <tr>
                        <th scope="row" className="font-mono-tabular py-1.5 pr-3 font-medium">
                          Ctrl/Cmd + L
                        </th>
                        <td className="font-body py-1.5">Focus Browser address bar</td>
                      </tr>
                      <tr>
                        <th scope="row" className="font-mono-tabular py-1.5 pr-3 font-medium">
                          Ctrl/Cmd + U
                        </th>
                        <td className="font-body py-1.5">View Page Source</td>
                      </tr>
                      <tr>
                        <th scope="row" className="font-mono-tabular py-1.5 pr-3 font-medium">
                          Ctrl/Cmd + D
                        </th>
                        <td className="font-body py-1.5">Bookmark active page</td>
                      </tr>
                      <tr>
                        <th scope="row" className="font-mono-tabular py-1.5 pr-3 font-medium">
                          F5
                        </th>
                        <td className="font-body py-1.5">Reload active page</td>
                      </tr>
                      <tr>
                        <th scope="row" className="font-mono-tabular py-1.5 pr-3 font-medium">
                          Arrows / Enter
                        </th>
                        <td className="font-body py-1.5">
                          Move or link Clue Cards on Notebook Board (Shift+Arrows for larger step, Delete to remove link)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="os-bevel-sunken space-y-1.5 p-3">
                <h3
                  className="font-chrome text-[0.875rem] font-semibold"
                  style={{ color: 'var(--color-phosphor)' }}
                >
                  Screen-Reader &amp; Assistive Guide
                </h3>
                <p className="font-body text-[0.8125rem] leading-relaxed">
                  Skip links appear at the start of Tab order to jump directly to Desktop
                  or Taskbar. Minimized windows are excluded from keyboard Tab order until
                  restored. Every informational sound posts a text cue in the Sound Log,
                  and every puzzle clue can be read, copied, or linked without vision or
                  mouse input.
                </p>
              </div>
            </section>
          )}

          {activeTab === 'save' && <SaveDataTab />}
        </div>
      </div>
    </div>
  );
}
