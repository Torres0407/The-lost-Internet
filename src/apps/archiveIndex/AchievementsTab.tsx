import { CheckCircle2, Lock } from 'lucide-react';
import { ACHIEVEMENTS } from '../../content/collection';
import type { UnlockedCollectionItem } from '../../state/collectionStore';

export interface AchievementsTabProps {
  unlockedAchievements: readonly UnlockedCollectionItem[];
  spoilersHidden: boolean;
}

export function AchievementsTab({
  unlockedAchievements,
  spoilersHidden,
}: AchievementsTabProps) {
  const unlockedMap = new Map(unlockedAchievements.map((item) => [item.id, item]));

  return (
    <div className="h-full overflow-y-auto p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2
          className="font-chrome text-[14px] font-semibold"
          style={{ color: 'var(--color-paper)' }}
        >
          Archive Milestones ({unlockedAchievements.length} / {ACHIEVEMENTS.length})
        </h2>
      </div>

      <ul className="space-y-2.5">
        {ACHIEVEMENTS.map((achievement, index) => {
          const unlocked = unlockedMap.get(achievement.id);
          const code = `C-${String(index + 1).padStart(3, '0')}`;
          const showLockedDetails = !unlocked && !spoilersHidden;

          return (
            <li
              key={achievement.id}
              className="border-2 p-3"
              style={{
                backgroundColor: unlocked ? 'var(--card-paper)' : 'var(--card-paper-locked)',
                borderColor: unlocked ? 'var(--bevel-light)' : 'var(--border-subtle)',
                color: 'var(--card-ink)',
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-start gap-2.5">
                  <span
                    className="font-chrome mt-0.5 inline-flex shrink-0 items-center gap-1 border px-1.5 py-0.5 text-[0.6875rem] font-bold"
                    style={{
                      backgroundColor: unlocked ? 'var(--color-panel-deep)' : 'var(--color-panel)',
                      borderColor: 'var(--border-subtle)',
                      color: unlocked ? 'var(--color-phosphor)' : 'var(--color-paper)',
                    }}
                  >
                    {unlocked ? (
                      <CheckCircle2 size={12} aria-hidden="true" />
                    ) : (
                      <Lock size={12} aria-hidden="true" />
                    )}
                    <span>{unlocked ? 'Unlocked' : 'Locked'}</span>
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span
                        className="font-mono-tabular text-[0.6875rem] font-bold"
                        style={{ color: 'var(--card-ink-muted)' }}
                      >
                        {code}
                      </span>
                      <h3 className="font-chrome text-[0.875rem] font-bold">
                        {unlocked || showLockedDetails ? achievement.name : '???'}
                      </h3>
                    </div>

                    {unlocked ? (
                      <p
                        className="font-body mt-1 text-[0.75rem] leading-relaxed"
                        style={{ color: 'var(--card-ink)' }}
                      >
                        {achievement.description}
                      </p>
                    ) : showLockedDetails ? (
                      <p
                        className="font-body mt-1 text-[0.75rem] leading-relaxed italic"
                        style={{ color: 'var(--card-ink-muted)' }}
                      >
                        Hint: {achievement.hint}
                      </p>
                    ) : null}
                  </div>
                </div>

                {unlocked && (
                  <time
                    className="font-mono-tabular shrink-0 text-[0.6875rem]"
                    style={{ color: 'var(--card-ink-muted)' }}
                  >
                    {new Date(unlocked.unlockedAt).toLocaleDateString()}
                  </time>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
