import { useEffect, useState } from 'react';

function formatClock(date: Date) {
  const timeText = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);

  const dateText = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date);

  return {
    timeText,
    dateText,
    iso: date.toISOString(),
  };
}

export function TaskbarClock() {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const { timeText, dateText, iso } = formatClock(now);

  return (
    <div
      className="os-bevel-sunken flex h-8 shrink-0 items-center gap-2 px-3"
      aria-label={`Current time ${timeText}, ${dateText}`}
    >
      <time
        dateTime={iso}
        className="font-mono-tabular text-[13px] font-medium whitespace-nowrap"
        style={{ color: 'var(--color-paper)' }}
      >
        {timeText}
      </time>
      <span
        aria-hidden="true"
        className="text-xs"
        style={{ color: 'var(--color-paper-muted)' }}
      >
        /
      </span>
      <span
        className="font-mono-tabular hidden text-[12px] whitespace-nowrap sm:inline"
        style={{ color: 'var(--color-paper-muted)' }}
      >
        {dateText}
      </span>
    </div>
  );
}
