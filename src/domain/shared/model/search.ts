import type { TextLocation, File } from './file.js';
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
}

export interface FileMatchRecord extends MatchRecord {
  id: File['id'];
  location: TextLocation;
}

export interface SearchResult {
  entityId: EntityId;
  rank: number;
  matches: {
    [SearchFields.Title]?: MatchRecord;
    [SearchFields.Body]?: MatchRecord;
    [SearchFields.File]?: FileMatchRecord[];
  };
}

export interface SearchResultVO extends Entity {
  matches: SearchResult['matches'];
  path: EntityPath;
}
