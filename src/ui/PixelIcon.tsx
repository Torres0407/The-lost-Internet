import type { AppId } from '../os/types';

interface PixelIconProps {
  id: AppId;
  size?: number;
}

export function PixelIcon({ id, size = 40 }: PixelIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className="pixelated shrink-0"
    >
      {id === 'browser' && (
        <>
          {/* Outer frame */}
          <rect x="1" y="2" width="14" height="12" fill="#1d3a3f" />
          <rect x="2" y="3" width="12" height="10" fill="#0b1418" />
          {/* Title bar */}
          <rect x="2" y="3" width="12" height="2" fill="#38f2b0" />
          <rect x="12" y="3" width="1" height="1" fill="#0b1418" />
          {/* Globe inside viewport */}
          <rect x="6" y="6" width="4" height="1" fill="#38f2b0" />
          <rect x="5" y="7" width="6" height="4" fill="#1d3a3f" />
          <rect x="6" y="11" width="4" height="1" fill="#38f2b0" />
          <rect x="7" y="6" width="2" height="6" fill="#e8e4d8" opacity="0.85" />
          <rect x="5" y="8" width="6" height="2" fill="#38f2b0" />
          {/* Border highlight */}
          <rect x="1" y="2" width="14" height="1" fill="#e8e4d8" />
          <rect x="1" y="2" width="1" height="12" fill="#e8e4d8" />
        </>
      )}

      {id === 'notebook' && (
        <>
          {/* Cover shadow */}
          <rect x="3" y="1" width="11" height="14" fill="#1d3a3f" />
          {/* Paper page */}
          <rect x="4" y="2" width="9" height="12" fill="#e8e4d8" />
          {/* Spiral spine */}
          <rect x="2" y="2" width="2" height="12" fill="#ffb347" />
          <rect x="2" y="3" width="1" height="1" fill="#0b1418" />
          <rect x="2" y="6" width="1" height="1" fill="#0b1418" />
          <rect x="2" y="9" width="1" height="1" fill="#0b1418" />
          <rect x="2" y="12" width="1" height="1" fill="#0b1418" />
          {/* Ruled lines */}
          <rect x="5" y="4" width="6" height="1" fill="#1d3a3f" />
          <rect x="5" y="6" width="7" height="1" fill="#1d3a3f" />
          <rect x="5" y="8" width="5" height="1" fill="#1d3a3f" />
          <rect x="5" y="10" width="6" height="1" fill="#38f2b0" />
          {/* Bookmark ribbon */}
          <rect x="10" y="1" width="2" height="4" fill="#ff4fa3" />
        </>
      )}

      {id === 'archive-index' && (
        <>
          {/* Lantern / Archive cabinet */}
          <rect x="5" y="1" width="6" height="2" fill="#e8e4d8" />
          <rect x="3" y="3" width="10" height="11" fill="#1d3a3f" />
          <rect x="4" y="4" width="8" height="9" fill="#0b1418" />
          {/* Warm lantern core */}
          <rect x="6" y="5" width="4" height="5" fill="#ffb347" />
          <rect x="7" y="6" width="2" height="3" fill="#e8e4d8" />
          {/* Index drawer bars */}
          <rect x="4" y="11" width="8" height="2" fill="#38f2b0" />
          <rect x="7" y="11" width="2" height="1" fill="#0b1418" />
          <rect x="3" y="14" width="10" height="1" fill="#e8e4d8" />
        </>
      )}

      {id === 'mail' && (
        <>
          {/* Envelope body */}
          <rect x="1" y="3" width="14" height="10" fill="#e8e4d8" />
          <rect x="1" y="12" width="14" height="1" fill="#1d3a3f" />
          <rect x="14" y="3" width="1" height="10" fill="#1d3a3f" />
          {/* Envelope flap */}
          <rect x="2" y="4" width="2" height="1" fill="#1d3a3f" />
          <rect x="4" y="5" width="2" height="1" fill="#1d3a3f" />
          <rect x="6" y="6" width="4" height="1" fill="#1d3a3f" />
          <rect x="10" y="5" width="2" height="1" fill="#1d3a3f" />
          <rect x="12" y="4" width="2" height="1" fill="#1d3a3f" />
          {/* Wax seal */}
          <rect x="7" y="7" width="2" height="2" fill="#ff4fa3" />
          {/* Postage stamp */}
          <rect x="11" y="4" width="2" height="2" fill="#38f2b0" />
        </>
      )}

      {id === 'files' && (
        <>
          {/* Folder tab */}
          <rect x="2" y="3" width="5" height="2" fill="#ffb347" />
          {/* Folder back */}
          <rect x="2" y="5" width="12" height="9" fill="#1d3a3f" />
          {/* Protruding paper */}
          <rect x="4" y="4" width="8" height="2" fill="#e8e4d8" />
          {/* Folder front */}
          <rect x="1" y="6" width="14" height="8" fill="#ffb347" />
          <rect x="1" y="6" width="14" height="1" fill="#e8e4d8" />
          <rect x="1" y="13" width="14" height="1" fill="#1d3a3f" />
          {/* Label notch */}
          <rect x="5" y="9" width="6" height="2" fill="#0b1418" />
          <rect x="6" y="9" width="4" height="1" fill="#38f2b0" />
        </>
      )}

      {id === 'settings' && (
        <>
          {/* Pixel gear */}
          <rect x="6" y="1" width="4" height="2" fill="#e8e4d8" />
          <rect x="6" y="13" width="4" height="2" fill="#e8e4d8" />
          <rect x="1" y="6" width="2" height="4" fill="#e8e4d8" />
          <rect x="13" y="6" width="2" height="4" fill="#e8e4d8" />
          <rect x="3" y="3" width="2" height="2" fill="#38f2b0" />
          <rect x="11" y="3" width="2" height="2" fill="#38f2b0" />
          <rect x="3" y="11" width="2" height="2" fill="#38f2b0" />
          <rect x="11" y="11" width="2" height="2" fill="#38f2b0" />
          {/* Gear body */}
          <rect x="4" y="3" width="8" height="10" fill="#1d3a3f" />
          <rect x="3" y="4" width="10" height="8" fill="#1d3a3f" />
          <rect x="5" y="4" width="6" height="8" fill="#e8e4d8" />
          <rect x="4" y="5" width="8" height="6" fill="#e8e4d8" />
          {/* Center axle */}
          <rect x="6" y="6" width="4" height="4" fill="#0b1418" />
          <rect x="7" y="7" width="2" height="2" fill="#38f2b0" />
        </>
      )}

      {id === 'source' && (
        <>
          <rect x="2" y="1" width="12" height="14" fill="#1d3a3f" />
          <rect x="3" y="2" width="10" height="12" fill="#0b1418" />
          <rect x="2" y="1" width="12" height="1" fill="#e8e4d8" />
          <rect x="5" y="6" width="1" height="4" fill="#38f2b0" />
          <rect x="4" y="7" width="1" height="2" fill="#38f2b0" />
          <rect x="10" y="6" width="1" height="4" fill="#38f2b0" />
          <rect x="11" y="7" width="1" height="2" fill="#38f2b0" />
          <rect x="7" y="9" width="2" height="2" fill="#ffb347" />
          <rect x="8" y="6" width="1" height="3" fill="#ffb347" />
        </>
      )}

      {id === 'history' && (
        <>
          <rect x="3" y="2" width="10" height="12" fill="#1d3a3f" />
          <rect x="4" y="3" width="8" height="10" fill="#0b1418" />
          <rect x="5" y="4" width="6" height="6" fill="#1d3a3f" />
          <rect x="6" y="5" width="4" height="4" fill="#0b1418" />
          <rect x="8" y="5" width="1" height="3" fill="#38f2b0" />
          <rect x="8" y="7" width="2" height="1" fill="#ffb347" />
          <rect x="5" y="11" width="6" height="1" fill="#e8e4d8" />
        </>
      )}

      {id === 'sound-log' && (
        <>
          <rect x="2" y="6" width="3" height="4" fill="#e8e4d8" />
          <rect x="5" y="4" width="2" height="8" fill="#ffb347" />
          <rect x="7" y="2" width="2" height="12" fill="#ffb347" />
          <rect x="11" y="5" width="1" height="6" fill="#38f2b0" />
          <rect x="13" y="3" width="1" height="10" fill="#38f2b0" />
        </>
      )}
    </svg>
  );
}
