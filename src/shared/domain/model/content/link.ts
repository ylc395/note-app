import type { EntityLocator } from '../entity.js';

export interface Source {
  targetFragmentId?: string;
  snippet: string;
  highlightStart: number;
  highlightEnd: number;
}

export interface LinkSourceVO extends EntityLocator {
  title: string;
  sources: Source[];
}

export interface LinkTargetVO extends EntityLocator {
  title: string;
}
