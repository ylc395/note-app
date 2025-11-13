import type { TextLocation } from './file.js';
import type { EntityTypes, EntityPath, Entity, EntityId } from './entity.js';
import type { Annotation, Selector } from './annotation.js';

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
  rootId?: EntityId[];
}

export interface MatchRecord {
  text: string;
  highlights: { start: number; end: number }[];
}

export interface FileMatchRecord extends MatchRecord {
  location: TextLocation;
}

export interface AnnotationMatchRecord extends MatchRecord {
  id: Annotation['id'];
  selector: Selector;
}

export interface SearchResult {
  entityId: EntityId;
  rank: number;
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
