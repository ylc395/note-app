import type { Knex } from 'knex';
import { Injectable } from '@nestjs/common';

import type { SearchEngine, SearchQuery } from 'infra/searchEngine';
import { EntityTypes } from 'interface/entity';
import SqliteDb from './Database';

const NOTE_FTS_TABLE = 'notes_fts';

@Injectable()
export default class SqliteSearchEngine implements SearchEngine {
  private knex?: Knex;
  readonly ready: Promise<void>;

  constructor(private readonly db: SqliteDb) {
    this.ready = this.init();
  }

  private async init() {
    this.knex = await this.db.getKnex();
    await Promise.all([this.createNoteFtsTable()]);
  }

  private async createNoteFtsTable() {
    if (!this.knex) {
      throw new Error('search engine not ready');
    }

    if (!(await this.knex.schema.hasTable(NOTE_FTS_TABLE))) {
      await this.knex.raw(
        `CREATE VIRTUAL TABLE ${NOTE_FTS_TABLE} USING fts5(id UNINDEXED, title, body, content="notes");`,
      );
      await this.knex.raw(`
        CREATE TRIGGER ${NOTE_FTS_TABLE}_ai AFTER INSERT ON notes
          BEGIN 
            INSERT INTO ${NOTE_FTS_TABLE} (title, body) VALUES (new.title, new.body);
          END;
      `);
      await this.knex.raw(`
        CREATE TRIGGER ${NOTE_FTS_TABLE}_ad AFTER DELETE on notes
          BEGIN
            INSERT INTO ${NOTE_FTS_TABLE} (${NOTE_FTS_TABLE}, rowid, title, body) VALUES ('delete', old.rowid, old.title, old.body);
          END;
      `);
      await this.knex.raw(`
        CREATE TRIGGER ${NOTE_FTS_TABLE}_au AFTER UPDATE on notes
          BEGIN
            INSERT INTO ${NOTE_FTS_TABLE} (${NOTE_FTS_TABLE}, rowid, title, body) VALUES ('delete', old.rowid, old.title, old.body);
            INSERT INTO ${NOTE_FTS_TABLE} (rowid, title, body) VALUES (new.rowid, new.title, new.body);
          END;
      `);
    }
  }

  async search(q: SearchQuery) {
    const types = q.type.length === 0 ? [EntityTypes.Material, EntityTypes.Memo, EntityTypes.Note] : q.type;

    return [];
  }
}
