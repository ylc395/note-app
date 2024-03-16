import type { Kysely } from 'kysely';
import { intersectionWith } from 'lodash-es';

import type { SearchEngine } from '@domain/infra/searchEngine.js';
import { type EntityId, EntityTypes } from '@domain/model/entity.js';
import type { SearchParams, SearchResult } from '@domain/model/search.js';

import SqliteDb from '../Database.js';
import { WRAPPER_END_TEXT, WRAPPER_START_TEXT, NOTE_FTS_TABLE, type SearchEngineDb } from './tables.js';

export default class SqliteSearchEngine implements SearchEngine {
  constructor(readonly sqliteDb: SqliteDb) {
    this.ready = this.createTables();
  }
  public ready: Promise<void>;

  get db() {
    return this.sqliteDb.getDb() as unknown as Kysely<SearchEngineDb>;
  }

  private async createTables() {
    await this.sqliteDb.ready;

    if (this.sqliteDb.hasTable(NOTE_FTS_TABLE)) {
      return;
    }
  }

  async search(q: SearchParams): Promise<SearchResult[]> {
    return [];
  }
}
