import type {
  ClueDef,
  ConnectionDef,
  PageDef,
  Site,
  SiteRegistry,
  ValidationProblem,
} from './types';
import { normalizeMeridianUrl } from './url';

function collectAllClues(
  sites: readonly Site[],
  extraClues: readonly ClueDef[]
): ClueDef[] {
  const combined: ClueDef[] = [];
  for (const site of sites) {
    if (site.clues) {
      combined.push(...site.clues);
    }
  }
  combined.push(...extraClues);
  return combined;
}

export function validateContent(
  sites: readonly Site[],
  extraClues: readonly ClueDef[] = [],
  connections: readonly ConnectionDef[] = []
): ValidationProblem[] {
  const problems: ValidationProblem[] = [];
  const seenUrls = new Set<string>();
  const grantedFacts = new Set<string>();
  const requiredFacts = new Set<string>();
  const allClues = collectAllClues(sites, extraClues);

  for (const site of sites) {
    for (const page of site.pages) {
      const normalized = normalizeMeridianUrl(page.url);
      if (!normalized) {
        problems.push({
          level: 'error',
          message: `Invalid meridian URL "${page.url}" in site "${site.id}".`,
          url: page.url,
        });
      } else if (seenUrls.has(normalized)) {
        problems.push({
          level: 'error',
          message: `Duplicate page URL "${normalized}" found in site "${site.id}".`,
          url: normalized,
        });
      } else {
        seenUrls.add(normalized);
      }

      for (const factId of page.grants ?? []) {
        if (!factId.trim()) {
          problems.push({
            level: 'error',
            message: `Empty grant fact id on page "${page.url}".`,
            url: page.url,
          });
        } else {
          grantedFacts.add(factId);
        }
      }

      for (const factId of page.requires ?? []) {
        if (!factId.trim()) {
          problems.push({
            level: 'error',
            message: `Empty requires fact id on page "${page.url}".`,
            url: page.url,
          });
        } else {
          requiredFacts.add(factId);
        }
      }
    }
  }

  for (const clue of allClues) {
    const normalizedClueUrl = normalizeMeridianUrl(clue.pageUrl);
    if (!normalizedClueUrl || !seenUrls.has(normalizedClueUrl)) {
      problems.push({
        level: 'error',
        message: `Clue "${clue.id}" references unknown page URL "${clue.pageUrl}".`,
        url: clue.pageUrl,
      });
    }
    for (const factId of clue.grants) {
      if (!factId.trim()) {
        problems.push({
          level: 'error',
          message: `Empty grant fact id in clue "${clue.id}".`,
        });
      } else {
        grantedFacts.add(factId);
      }
    }
  }

  for (const conn of connections) {
    for (const factId of conn.grants) {
      if (!factId.trim()) {
        problems.push({
          level: 'error',
          message: `Empty grant fact id in connection "${conn.id}".`,
        });
      } else {
        grantedFacts.add(factId);
      }
    }
  }

  for (const reqFact of requiredFacts) {
    if (!grantedFacts.has(reqFact)) {
      problems.push({
        level: 'error',
        message: `Required fact "${reqFact}" is never granted anywhere.`,
        factId: reqFact,
      });
    }
  }

  for (const grantedFact of grantedFacts) {
    if (!requiredFacts.has(grantedFact)) {
      problems.push({
        level: 'warning',
        message: `Fact "${grantedFact}" is granted but never required by any page.`,
        factId: grantedFact,
      });
    }
  }

  return problems;
}

export function buildRegistry(
  sites: readonly Site[],
  extraClues: readonly ClueDef[] = [],
  connections: readonly ConnectionDef[] = []
): SiteRegistry {
  const problems = validateContent(sites, extraClues, connections);
  const errors = problems.filter((p) => p.level === 'error');
  if (errors.length > 0) {
    throw new Error(
      `Content registry validation failed:\n${errors.map((e) => `- ${e.message}`).join('\n')}`
    );
  }

  const pagesByUrl = new Map<string, PageDef>();
  const allGrantedFacts = new Set<string>();
  const clues = collectAllClues(sites, extraClues);

  for (const site of sites) {
    for (const page of site.pages) {
      const normalized = normalizeMeridianUrl(page.url);
      if (normalized) {
        pagesByUrl.set(normalized, {
          ...page,
          url: normalized,
        });
      }
      for (const factId of page.grants ?? []) {
        allGrantedFacts.add(factId);
      }
    }
  }

  for (const clue of clues) {
    for (const factId of clue.grants) {
      allGrantedFacts.add(factId);
    }
  }

  for (const conn of connections) {
    for (const factId of conn.grants) {
      allGrantedFacts.add(factId);
    }
  }

  const warnings = problems.filter((p) => p.level === 'warning');

  return {
    sites,
    pagesByUrl,
    clues,
    connections,
    allGrantedFacts,
    warnings,
  };
}
