import { Injectable } from '@nestjs/common';
import type { Kysely } from 'kysely';
import intersectionWith from 'lodash/intersectionWith';

import type { SearchEngine } from 'infra/searchEngine';
import { type EntityId, EntityTypes } from 'model/entity';
import { type SearchParams, type SearchResult, Scopes } from 'model/search';

import SqliteDb, { type Db } from '../Database';
import type { Row as NoteRow } from '../schema/note';

import NoteSearchEngine, { NOTE_FTS_TABLE } from './NoteSearchEngine';
import { WRAPPER_END_TEXT, WRAPPER_START_TEXT } from './constants';

interface SearchEngineDb extends Db {
  [NOTE_FTS_TABLE]: NoteRow & { rowid: number; [NOTE_FTS_TABLE]: string; rank: number };
}

@Injectable()
export default class SqliteSearchEngine implements SearchEngine {
  readonly ready: Promise<void>;

  constructor(readonly sqliteDb: SqliteDb) {
    this.ready = this.init();
  }

  private readonly notes = new NoteSearchEngine(this);

  get db() {
    return this.sqliteDb.getDb() as unknown as Kysely<SearchEngineDb>;
  }

  private async init() {
    await this.sqliteDb.ready;
    await Promise.all([this.notes.createFtsTable()]);
  }

  async search(q: SearchParams) {
    const types = q.types || [EntityTypes.Note, EntityTypes.Memo, EntityTypes.Material, EntityTypes.MaterialAnnotation];

    let descantIds: EntityId[] | undefined;

    if (q.root) {
      if (types.length !== 1) {
        throw new Error('more than one type');
      }

      descantIds = await this.sqliteDb.getRepository('entities').findDescendantIds(types[0]!, [q.root]);
    }

    let searchResult = (
      await Promise.all([
        types.includes(EntityTypes.Note) ? this.notes.search(q) : [],
        // types.includes(EntityTypes.Material) ? this.searchMaterials(q) : [],
        // types.includes(EntityTypes.MaterialAnnotation) ? this.searchMaterialAnnotations(q) : [],
        // types.includes(EntityTypes.Memo) ? this.searchMemos(q) : [],
      ])
    ).flat();

    if (descantIds) {
      searchResult = intersectionWith(searchResult, descantIds, ({ entityId }, id) => entityId === id);
    }

    return searchResult.map((result) => {
      const { text: title, highlights: titleHighlights } = SqliteSearchEngine.extractSnippet(
        result.title,
        Scopes.Title,
      );
      const { text: body, highlights: bodyHighlights } = SqliteSearchEngine.extractSnippet(result.body, Scopes.Body);

      return { ...result, title, body, highlights: [...titleHighlights, ...bodyHighlights] };
    });
  }

  private static extractSnippet(snippet: string, type: Scopes) {
    const highlights: SearchResult['highlights'] = [];

    let i = 0;
    let index = -1;

    while ((index = snippet.indexOf(WRAPPER_START_TEXT, index + 1)) > -1) {
      const endIndex = snippet.indexOf(WRAPPER_END_TEXT, index + 1);

      highlights.push({
        start: index - (WRAPPER_START_TEXT.length + WRAPPER_END_TEXT.length) * i,
        end: endIndex - (WRAPPER_START_TEXT.length * (i + 1) + WRAPPER_END_TEXT.length * i) - 1,
        scope: type,
      });

      i += 1;
    }

    return {
      text: snippet.replaceAll(WRAPPER_START_TEXT, '').replaceAll(WRAPPER_END_TEXT, ''),
      highlights,
    };
  }
}
