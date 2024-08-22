import type { Entity } from './entity.js';
import type { FragmentSelector } from './annotation.js';

export interface Snippet {
  text: string;
  highlightStart: number;
  highlightEnd: number;
}

interface Offset {
  start: number;
  end: number;
}

export interface LinkVO {
  entity: Entity;
  links: Array<{
    targetSelector?: FragmentSelector;
    sourceLocation: Offset;
    sourceSnippet: Snippet;
  }>;
}

export interface ExternalLinkVO {
  url: string;
}

export interface TopicVO {
  name: string;
  entities: Array<{
    entity: Entity;
    sources: Array<{
      location: Offset;
      snippet: Snippet;
    }>;
  }>;
}
