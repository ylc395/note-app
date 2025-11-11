import type { TextLocation } from './file.js';
import type { EntityTypes, EntityPath, Entity, EntityId } from './entity.js';

export type SearchTypes = EntityTypes.Note | EntityTypes.Memo;

export enum SearchFields {
  Title = 'title',
  Body = 'body',
  File = 'file',
}

/**
 * @api
 */
export interface SearchRequest {
  keyword: string;
  entityTypes?: SearchTypes[];
  fields?: SearchFields[];
  rootId?: EntityId[];
}

export interface MatchRecord {
  text: string;
  highlights: { start: number; end: number }[];
  location?: TextLocation; // 搜索文件中的文本时
}

export interface SearchResult {
  entityId: EntityId;
  rank: number;
  matches: {
    [SearchFields.Title]?: MatchRecord;
    [SearchFields.Body]?: MatchRecord;
    [SearchFields.File]?: MatchRecord[];
  };
}

export interface SearchResultVO extends Entity {
  matches: SearchResult['matches'];
  path: EntityPath;
}
