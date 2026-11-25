export function Wallpaper() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
      style={{
        backgroundColor: 'var(--color-bg)',
        backgroundImage:
          'radial-gradient(ellipse 80% 65% at 62% 45%, rgba(29, 58, 63, 0.58) 0%, rgba(11, 20, 24, 0.96) 74%)',
      }}
    >
      {/* Subtle 32px retro desktop coordinate grid */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.16]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="lantern-desktop-grid"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 32 0 L 0 0 0 32"
              fill="none"
              stroke="#38f2b0"
              strokeWidth="0.75"
              strokeOpacity="0.35"
            />
            <rect x="0" y="0" width="1.5" height="1.5" fill="#38f2b0" fillOpacity="0.45" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#lantern-desktop-grid)" />
      </svg>

      {/* Quiet centered geometric Meridian horizon emblem */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          width="240"
          height="240"
          viewBox="0 0 120 120"
          fill="none"
          className="opacity-[0.14]"
        >
          <circle
            cx="60"
            cy="60"
            r="46"
            stroke="#38f2b0"
            strokeWidth="1"
            strokeDasharray="2 4"
          />
          <circle cx="60" cy="60" r="30" stroke="#ffb347" strokeWidth="1" />
          <line x1="60" y1="6" x2="60" y2="114" stroke="#38f2b0" strokeWidth="1" />
          <line x1="6" y1="60" x2="114" y2="60" stroke="#38f2b0" strokeWidth="1" />
          <rect
            x="56"
            y="56"
            width="8"
            height="8"
            stroke="#e8e4d8"
            strokeWidth="1"
          />
        </svg>
      </div>

      {/* Subtle static phosphor scanline texture */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, #000000 2px, #000000 4px)',
        }}
      />
    </div>
  );
}
