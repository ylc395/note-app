import { Injectable } from '@nestjs/common';
import { type Kysely, sql } from 'kysely';

import { type SearchEngine, type SearchQuery, Types, Scopes, SearchResult } from 'infra/searchEngine';
import SqliteDb from './Database';
import noteTable from './schema/note';

const NOTE_FTS_TABLE = 'notes_fts';

interface SearchEngineDb {
  [NOTE_FTS_TABLE]: { id: string; title: string; body: string };
}
@Injectable()
export default class SqliteSearchEngine implements SearchEngine {
  private db?: Kysely<SearchEngineDb>;
  readonly ready: Promise<void>;

  constructor(private sqliteDb: SqliteDb) {
    this.ready = this.init();
  }

  private async init() {
    this.db = (await this.sqliteDb.getDb()) as unknown as Kysely<SearchEngineDb>;
    await Promise.all([this.createNoteFtsTable()]);
  }

  private async createNoteFtsTable() {
    if (!this.db) {
      throw new Error('search engine not ready');
    }

    if (this.sqliteDb.hasTable(NOTE_FTS_TABLE)) {
      return;
    }

    await sql`CREATE VIRTUAL TABLE IF NOT EXISTS ${NOTE_FTS_TABLE} USING fts5(id UNINDEXED, title, body, content="${noteTable.tableName}");`.execute(
      this.db,
    );
    await sql`
        CREATE TRIGGER ${NOTE_FTS_TABLE}_ai AFTER INSERT ON ${noteTable.tableName}
          BEGIN 
            INSERT INTO ${NOTE_FTS_TABLE} (title, body) VALUES (new.title, new.body);
          END;
      `.execute(this.db);
    await sql`
        CREATE TRIGGER ${NOTE_FTS_TABLE}_ad AFTER DELETE on ${noteTable.tableName}
          BEGIN
            INSERT INTO ${NOTE_FTS_TABLE} (${NOTE_FTS_TABLE}, rowid, title, body) VALUES ('delete', old.rowid, old.title, old.body);
          END;
      `.execute(this.db);
    await sql`
        CREATE TRIGGER ${NOTE_FTS_TABLE}_au AFTER UPDATE on ${noteTable.tableName}
          BEGIN
            INSERT INTO ${NOTE_FTS_TABLE} (${NOTE_FTS_TABLE}, rowid, title, body) VALUES ('delete', old.rowid, old.title, old.body);
            INSERT INTO ${NOTE_FTS_TABLE} (rowid, title, body) VALUES (new.rowid, new.title, new.body);
          END;
      `.execute(this.db);
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
    if (!this.db) {
      throw new Error('no knex');
    }

    const term = q.terms.join(' ');
    const query = this.db
      .selectFrom(NOTE_FTS_TABLE)
      .select([
        sql<string>`snippet(${NOTE_FTS_TABLE}, 1, "[", "]", "...",  10)`.as('title'),
        sql<string>`snippet(${NOTE_FTS_TABLE}, 2, "[", "]", "...",  10)`.as('content'),
        'id as entityId',
      ]);

    if (!q.scopes) {
      query.where(sql`NOTE_FTS_TABLE`, '=', term);
    } else {
      if (q.scopes.includes(Scopes.Body)) {
        query.where('body', 'match', term);
      }

      if (q.scopes.includes(Scopes.Title)) {
        query.where('title', 'match', term);
      }
    }

    const result = await query.execute();

    return result.map((row) => ({ ...row, type: Types.Note }));
  }
}
