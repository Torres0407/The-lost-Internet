import { useEffect, useState } from 'react';
import { attachAudioSystem } from './audio/audioEngine';
import { BootSequence } from './os/boot/BootSequence';
import { DesktopScreen } from './os/DesktopScreen';
import { LiveRegions } from './os/LiveRegions';
import {
  persistenceController,
  useSaveStatusStore,
} from './state/persistence/persistenceController';
import { initSettingsDomSync, useSettingsStore } from './state/settingsStore';

export default function App() {
  const bootStage = useSaveStatusStore((state) => state.bootStage);
  const audioChoiceMade = useSettingsStore((state) => state.audioChoiceMade);
  const bootReplayToken = useSettingsStore((state) => state.bootReplayToken);

  const [bootComplete, setBootComplete] = useState(false);

  useEffect(() => {
    const detachSettings = initSettingsDomSync();
    const detachAudio = attachAudioSystem({
      subscribeSaveStatus: (listener) => useSaveStatusStore.subscribe(listener),
    });
    void persistenceController.start();

    return () => {
      detachSettings();
      detachAudio();
    };
  }, []);

  // Re-show boot sequence whenever Start Over or Debug 'Show boot again' runs
  useEffect(() => {
    if (bootStage === 'boot-prompt') {
      setBootComplete(false);
    }
  }, [bootStage]);

  useEffect(() => {
    if (bootReplayToken > 0) {
      setBootComplete(false);
    }
  }, [bootReplayToken]);

  const showBoot = !bootComplete || bootStage !== 'ready';

  return (
    <>
      {showBoot ? (
        <BootSequence
          key={bootReplayToken}
          persistenceStage={bootStage}
          audioChoiceMade={audioChoiceMade}
          onComplete={() => {
            if (bootStage === 'boot-prompt') {
              persistenceController.enterDesktop();
            }
            setBootComplete(true);
          }}
        />
      ) : (
        <DesktopScreen />
      )}
      <LiveRegions />
    </>
  );
}
