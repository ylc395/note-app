import type { Entity } from './entity.js';

export interface TextLocation {
  start: number;
  end: number;
}

export interface Snippet {
  text: string;
  highlights: TextLocation[];
}

export interface LinkVO {
  sourceEntity: Entity;
  sourceLocation: TextLocation; // 链接的起点，仅有可能是文字
  sourceSnippet: Required<Snippet>;
  targetEntity: Entity;
  targetFragmentId: string | null; // URL 的 hash 部分。很可能随着目标的内容的变化而失效
  targetSnippet: Snippet | null; // 链接的终点，有可能是任何东西的片段。但只有文字片段才有可能有该属性
}

export interface ExternalReference {
  location: TextLocation;
  snippet: Snippet;
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
