import type { Knex } from 'knex';
import { Injectable } from '@nestjs/common';

import { type SearchEngine, type SearchQuery, Types, Scopes, SearchResult } from 'infra/searchEngine';
import SqliteDb from './Database';
import noteTable from './schema/note';

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
        `CREATE VIRTUAL TABLE ${NOTE_FTS_TABLE} USING fts5(id UNINDEXED, title, body, content="${noteTable.tableName}");`,
      );
      await this.knex.raw(`
        CREATE TRIGGER ${NOTE_FTS_TABLE}_ai AFTER INSERT ON ${noteTable.tableName}
          BEGIN 
            INSERT INTO ${NOTE_FTS_TABLE} (title, body) VALUES (new.title, new.body);
          END;
      `);
      await this.knex.raw(`
        CREATE TRIGGER ${NOTE_FTS_TABLE}_ad AFTER DELETE on ${noteTable.tableName}
          BEGIN
            INSERT INTO ${NOTE_FTS_TABLE} (${NOTE_FTS_TABLE}, rowid, title, body) VALUES ('delete', old.rowid, old.title, old.body);
          END;
      `);
      await this.knex.raw(`
        CREATE TRIGGER ${NOTE_FTS_TABLE}_au AFTER UPDATE on ${noteTable.tableName}
          BEGIN
            INSERT INTO ${NOTE_FTS_TABLE} (${NOTE_FTS_TABLE}, rowid, title, body) VALUES ('delete', old.rowid, old.title, old.body);
            INSERT INTO ${NOTE_FTS_TABLE} (rowid, title, body) VALUES (new.rowid, new.title, new.body);
          END;
      `);
    }
  }

  async search(q: SearchQuery) {
    const types = q.types || [Types.Note, Types.Memo, Types.Html, Types.Pdf];
    const searchPromises = types.map((type) => {
      if (type === Types.Note) {
        return this.searchNotes(q);
      }

      throw new Error('unsupported type');
    });

    console.log(await Promise.all(searchPromises));

    return [];
  }

  private async searchNotes(q: SearchQuery): Promise<SearchResult[]> {
    if (!this.knex) {
      throw new Error('no knex');
    }

    const term = q.terms.join(' ');
    const query = this.knex(NOTE_FTS_TABLE).select(
      this.knex.raw(`snippet(${NOTE_FTS_TABLE}, 1, "[", "]", "...",  10) as title`),
      this.knex.raw(`snippet(${NOTE_FTS_TABLE}, 2, "[", "]", "...",  10) as content`),
      'id as entityId',
    );

    if (!q.scopes) {
      query.where(NOTE_FTS_TABLE, term);
    } else {
      if (q.scopes.includes(Scopes.Body)) {
        query.andWhereRaw('body MATCH ?', [term]);
      }

      if (q.scopes.includes(Scopes.Title)) {
        query.andWhereRaw('title MATCH ?', [term]);
      }
    }

    const result = await query;

    return result.map((row) => ({ ...row, type: Types.Note }));
  }
}
