import { Injectable } from '@nestjs/common';
import type { Kysely } from 'kysely';
import intersectionWith from 'lodash/intersectionWith';

import type { SearchEngine } from 'infra/searchEngine';
import { type EntityId, EntityTypes } from 'model/entity';
import type { ContentEntityTypes } from 'model/content';
import { type SearchParams, type SearchResult, Scopes } from 'model/search';

import SqliteDb, { type Db } from '../Database';
import type { Row as NoteRow } from '../schema/note';
import type { Row as MemoRow } from '../schema/memo';
import type { Row as FileTextRow } from '../schema/fileText';

import NoteSearchEngine, { NOTE_FTS_TABLE } from './NoteSearchEngine';
import MemoSearchEngine, { MEMO_FTS_TABLE } from './MemoSearchEngine';
import MaterialSearchEngine, { FILE_TEXTS_FTS_TABLE } from './MaterialSearchEngine';
import { WRAPPER_END_TEXT, WRAPPER_START_TEXT } from './constants';

interface SearchEngineDb extends Db {
  [NOTE_FTS_TABLE]: NoteRow & { rowid: number; [NOTE_FTS_TABLE]: string; rank: number };
  [MEMO_FTS_TABLE]: MemoRow & { rowid: number; [MEMO_FTS_TABLE]: string; rank: number };
  [FILE_TEXTS_FTS_TABLE]: FileTextRow & { rowid: number; [FILE_TEXTS_FTS_TABLE]: string; rank: number };
}

@Injectable()
export default class SqliteSearchEngine implements SearchEngine {
  readonly ready: Promise<void>;

  constructor(readonly sqliteDb: SqliteDb) {
    this.ready = this.init();
  }

  private readonly notes = new NoteSearchEngine(this);
  private readonly memos = new MemoSearchEngine(this);
  private readonly materials = new MaterialSearchEngine(this);

  get db() {
    return this.sqliteDb.getDb() as unknown as Kysely<SearchEngineDb>;
  }

  private async init() {
    await this.sqliteDb.ready;
    await Promise.all([this.notes.createFtsTable(), this.memos.createFtsTable()]);
  }

  async search(q: SearchParams) {
    const types: ContentEntityTypes[] = q.types || [
      EntityTypes.Note,
      EntityTypes.Memo,
      EntityTypes.Material,
      EntityTypes.MaterialAnnotation,
    ];

    let descantIds: EntityId[] | undefined;

    if (q.root) {
      if (types.length !== 1) {
        throw new Error('more than one type');
      }

      const descants = await this.sqliteDb
        .getRepository('entities')
        .findDescendantIds([{ entityType: EntityTypes.Note, entityId: q.root }]);

      descantIds = descants[EntityTypes.Note][q.root];
    }

    let searchResult = (
      await Promise.all([
        types.includes(EntityTypes.Note) ? this.notes.search(q) : [],
        types.includes(EntityTypes.Material) ? this.materials.search(q) : [],
        types.includes(EntityTypes.Memo) ? this.memos.search(q) : [],
      ])
    ).flat();

    if (descantIds) {
      searchResult = intersectionWith(searchResult, descantIds, ({ entityId }, id) => entityId === id);
    }

    return searchResult.map((result) => {
      const { text: body, highlights: bodyHighlights } = SqliteSearchEngine.extractSnippet(result.body, Scopes.Body);
      const withTitle = [EntityTypes.Note, EntityTypes.Material].includes(result.entityType);
      const { text: title, highlights: titleHighlights } = withTitle
        ? SqliteSearchEngine.extractSnippet(result.title, Scopes.Title)
        : { text: result.title, highlights: [] };

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
