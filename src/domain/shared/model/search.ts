import type { TextLocation } from './file.js';
import type { EntityTypes, EntityPath, Entity, EntityId } from './entity.js';
import type { Annotation } from './annotation.js';

export type SearchTypes = EntityTypes.Note | EntityTypes.Memo;

export enum SearchFields {
  Title = 'title',
  Body = 'body',
  File = 'file',
  Annotation = 'annotation',
}

/**
 * @api
 */
export interface SearchRequest {
  keyword: string;
  entityTypes?: SearchTypes[];
  fields?: SearchFields[];
  rootId?: EntityId[]; // 包含 rootId 本身
}

export interface MatchRecord {
  text: string; // 搜索引擎截取出的片段
  highlights: { start: number; end: number }[]; // 片段中高亮部分的在片段中的位置
  offsets: { start: number; end: number }[]; // 片段中高亮部分在全文中的位置
}

export interface FileMatchRecord extends MatchRecord {
  location: Pick<TextLocation, 'page' | 'confidence'>;
}

export interface AnnotationMatchRecord extends MatchRecord {
  id: Annotation['id'];
  selector: Annotation['selector'];
}

export interface SearchResult {
  entityId: EntityId;
  matches: {
    [SearchFields.Title]?: MatchRecord;
    [SearchFields.Body]?: MatchRecord;
    [SearchFields.Annotation]?: AnnotationMatchRecord[];
    [SearchFields.File]?: FileMatchRecord[];
  };
}

export interface SearchResultVO extends Entity {
  matches: SearchResult['matches'];
  path: EntityPath;
}
