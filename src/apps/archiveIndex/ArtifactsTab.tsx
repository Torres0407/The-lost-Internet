import { Circle, Diamond, Sparkles, Star } from 'lucide-react';
import { ARTIFACTS, type ArtifactRarity } from '../../content/collection';
import type { UnlockedCollectionItem } from '../../state/collectionStore';
import { PixelSprite } from './PixelSprite';

export interface ArtifactsTabProps {
  unlockedArtifacts: readonly UnlockedCollectionItem[];
  spoilersHidden: boolean;
}

const RARITY_LABELS: Record<ArtifactRarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  unique: 'Unique',
};

function RarityIcon({ rarity }: { rarity: ArtifactRarity }) {
  switch (rarity) {
    case 'common':
      return <Circle size={12} aria-hidden="true" />;
    case 'uncommon':
      return <Diamond size={12} aria-hidden="true" />;
    case 'rare':
      return <Star size={12} aria-hidden="true" />;
    case 'unique':
      return <Sparkles size={12} aria-hidden="true" />;
  }
}

export function ArtifactsTab({
  unlockedArtifacts,
  spoilersHidden,
}: ArtifactsTabProps) {
  const unlockedMap = new Map(unlockedArtifacts.map((item) => [item.id, item]));

  return (
    <div className="h-full overflow-y-auto p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2
          className="font-chrome text-[14px] font-semibold"
          style={{ color: 'var(--color-paper)' }}
        >
          Recovered Artifact Catalogue ({unlockedArtifacts.length} / {ARTIFACTS.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ARTIFACTS.map((artifact, index) => {
          const unlocked = unlockedMap.get(artifact.id);
          const catalogId = `A-${String(index + 1).padStart(3, '0')}`;
          const rarityLabel = RARITY_LABELS[artifact.rarity];

          return (
            <article
              key={artifact.id}
              className="flex flex-col justify-between border-2 p-3"
              style={{
                backgroundColor: unlocked ? 'var(--card-paper)' : 'var(--card-paper-locked)',
                borderColor: unlocked ? 'var(--bevel-light)' : 'var(--border-subtle)',
                color: 'var(--card-ink)',
              }}
            >
              <div>
                <div
                  className="mb-2 flex items-center justify-between gap-2 border-b pb-1.5"
                  style={{ borderBottomColor: 'var(--border-subtle)' }}
                >
                  <span
                    className="font-mono-tabular text-[0.6875rem] font-bold"
                    style={{ color: 'var(--card-ink-muted)' }}
                  >
                    {catalogId}
                  </span>
                  <span
                    className="font-chrome inline-flex items-center gap-1 border px-1.5 py-0.5 text-[0.6875rem] font-bold"
                    style={{
                      backgroundColor: 'var(--color-panel-deep)',
                      borderColor: 'var(--border-subtle)',
                      color:
                        artifact.rarity === 'unique'
                          ? 'var(--color-magenta)'
                          : artifact.rarity === 'rare'
                            ? 'var(--color-amber)'
                            : artifact.rarity === 'uncommon'
                              ? 'var(--color-phosphor)'
                              : 'var(--color-paper)',
                    }}
                  >
                    <RarityIcon rarity={artifact.rarity} />
                    <span>{rarityLabel}</span>
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center border p-1"
                    style={{
                      backgroundColor: unlocked ? '#0b1418' : '#b8b2a4',
                      borderColor: '#1d3a3f',
                    }}
                  >
                    <PixelSprite
                      name={artifact.name}
                      sprite={artifact.sprite}
                      palette={artifact.palette}
                      silhouette={!unlocked}
                      size={44}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-chrome text-[14px] leading-snug font-bold">
                      {unlocked ? artifact.name : '???'}
                    </h3>

                    {unlocked ? (
                      <p
                        className="font-body mt-1 text-[0.75rem] leading-relaxed"
                        style={{ color: 'var(--card-ink)' }}
                      >
                        {artifact.description}
                      </p>
                    ) : (
                      <p
                        className="font-body mt-1 text-[0.75rem] leading-relaxed italic"
                        style={{ color: 'var(--card-ink-muted)' }}
                      >
                        {spoilersHidden ? 'Hint hidden (spoilers off).' : artifact.hint}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div
                className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t pt-1.5 text-[0.6875rem]"
                style={{
                  borderTopColor: 'var(--border-subtle)',
                  color: 'var(--card-ink-muted)',
                }}
              >
                {unlocked ? (
                  <>
                    <span className="font-body font-semibold">
                      Recovered from: {artifact.sourceSite}
                    </span>
                    <time className="font-mono-tabular">
                      {new Date(unlocked.unlockedAt).toLocaleDateString()}
                    </time>
                  </>
                ) : (
                  <span className="font-mono-tabular font-semibold">Status: Locked</span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
