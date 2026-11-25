import { CONNECTION_DEFS } from '../content/connections';
import { ALL_SITES, CLUE_DEFS } from '../content/sites';
import { buildRegistry } from './registry';
import type { SiteRegistry } from './types';

export const GAME_REGISTRY: SiteRegistry = buildRegistry(
  ALL_SITES,
  CLUE_DEFS,
  CONNECTION_DEFS
);
