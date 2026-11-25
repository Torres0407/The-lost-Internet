import { useEffect, useState } from 'react';
import { subscribeShellEvents } from '../events/eventBus';

/**
 * Single root polite + single root assertive live region for the entire app.
 */
export function LiveRegions() {
  const [politeText, setPoliteText] = useState('');
  const [assertiveText, setAssertiveText] = useState('');

  useEffect(() => {
    return subscribeShellEvents((event) => {
      if (event.type === 'os/announce') {
        setPoliteText(event.message);
      } else if (event.type === 'os/announce-assertive') {
        setAssertiveText(event.message);
      }
    });
  }, []);

  return (
    <>
      <div
        id="tli-live-polite"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeText}
      </div>
      <div
        id="tli-live-assertive"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveText}
      </div>
    </>
  );
}
