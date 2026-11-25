export interface PixelSpriteProps {
  name: string;
  sprite: readonly string[];
  palette: Readonly<Record<string, string>>;
  silhouette?: boolean;
  size?: number;
}

export function PixelSprite({
  name,
  sprite,
  palette,
  silhouette = false,
  size = 48,
}: PixelSpriteProps) {
  const ariaLabel = silhouette ? 'Locked artifact silhouette' : name;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      shapeRendering="crispEdges"
      role="img"
      aria-label={ariaLabel}
      className="pixelated shrink-0"
    >
      {sprite.map((row, y) =>
        Array.from(row).map((ch, x) => {
          if (ch === '.') {
            return null;
          }
          const fill = silhouette ? '#13282c' : (palette[ch] ?? '#0b1418');
          return (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={fill}
            />
          );
        })
      )}
    </svg>
  );
}
