import type { TextLocation } from '@domain/server/model/file.js';
import type { EntityTypes, EntityPath, Entity, EntityId } from './entity.js';
import type { EntityMaterial } from './material.js';

export type SearchTypes = EntityTypes.Note | EntityTypes.Memo | EntityTypes.Material;

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
  rootId?: EntityId;
  includingRecyclables?: boolean;
}

interface MatchRecord {
  text: string;
  highlights: { start: number; end: number }[];
  location?: TextLocation;
}

export interface SearchResult {
  entityId: EntityId;
  mimeType?: EntityMaterial['mimeType'];
  rank: number;
  matches: {
    [SearchFields.Title]?: MatchRecord;
    [SearchFields.Body]?: MatchRecord;
    [SearchFields.File]?: MatchRecord[];
  };
}

export interface SearchResultVO extends Entity {
  mimeType?: SearchResult['mimeType'];
  matches: SearchResult['matches'];
  path?: EntityPath;
}
