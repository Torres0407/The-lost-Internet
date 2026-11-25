export interface PageDef {
  url: string;
  title: string;
  html: string;
  requires?: string[];
  grants?: string[];
  hidden?: boolean;
  lockedNotice?: string;
}

export interface ClueDef {
  id: string;
  pageUrl: string;
  text: string;
  grants: string[];
}

export interface ConnectionDef {
  id: string;
  clueMatchers: [string, string];
  grants: string[];
  insightTitle: string;
  insightText: string;
}

export interface Site {
  id: string;
  name: string;
  pages: PageDef[];
  clues?: ClueDef[];
}

export interface ValidationProblem {
  level: 'error' | 'warning';
  message: string;
  url?: string;
  factId?: string;
}

export interface SiteRegistry {
  sites: readonly Site[];
  pagesByUrl: ReadonlyMap<string, PageDef>;
  clues: readonly ClueDef[];
  connections: readonly ConnectionDef[];
  allGrantedFacts: ReadonlySet<string>;
  warnings: readonly ValidationProblem[];
}

export type ResolveResult =
  | { status: 'ok'; page: PageDef; newFacts: string[] }
  | { status: 'locked'; page: PageDef; missing: string[] }
  | { status: 'not_found' };
