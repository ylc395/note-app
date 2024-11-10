import type { Entity } from './entity.js';

export interface TextLocation {
  start: number;
  end: number;
}

export interface Snippet {
  text: string;
  highlight?: TextLocation;
}

export interface Reference {
  entity: Entity;
  sourceLocation: TextLocation;
  sourceSnippet: Required<Snippet>;
  targetFragmentId: string | null; // URL 的 hash 部分。很可能随着目标的内容的变化而失效
  targetSnippet: Snippet;
}

export interface Referrer {
  entity: Entity;
  references: Reference[];
}

export interface ExternalLinkVO {
  url: string;
  icon: string | null;
}

export interface TopicVO {
  name: string;
  entities: Array<{
    entity: Entity;
    sources: Array<{
      location: TextLocation;
      snippet: Snippet;
    }>;
  }>;
}
