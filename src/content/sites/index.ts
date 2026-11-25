import type { ClueDef, Site } from '../../engine/types';
import { BACKROOM_SITE } from './backroom';
import { DELPHINES_GARDEN_SITE } from './delphinesGarden';
import { LAMPLIGHTER_SITE } from './lamplighter';
import { NIGHTCRAWLER_SITE } from './nightcrawler';
import { RING_HUB_SITE } from './ringHub';
import { TUMBLEWEED_SITE } from './tumbleweed';

export const ALL_SITES: readonly Site[] = [
  RING_HUB_SITE,
  DELPHINES_GARDEN_SITE,
  TUMBLEWEED_SITE,
  BACKROOM_SITE,
  LAMPLIGHTER_SITE,
  NIGHTCRAWLER_SITE,
];

export const CLUE_DEFS: readonly ClueDef[] = ALL_SITES.flatMap(
  (site) => site.clues ?? []
);
