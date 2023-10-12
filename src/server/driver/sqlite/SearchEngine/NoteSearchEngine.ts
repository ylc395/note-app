import { sql } from 'kysely';

import { type SearchParams, Scopes } from 'model/search';
import { EntityTypes } from 'model/entity';

import noteTable from '../schema/note';
import type SearchEngine from './index';
import { NOTE_FTS_TABLE, WRAPPER_END_TEXT, WRAPPER_START_TEXT, commonSql } from './tables';
import { normalizeTitle } from 'model/note';

export default class SqliteNoteSearchEngine {
  constructor(private readonly engine: SearchEngine) {}

  async createFtsTable() {
    if (this.engine.sqliteDb.hasTable(NOTE_FTS_TABLE)) {
      return;
    }

    await sql`
      CREATE VIRTUAL TABLE ${sql.table(NOTE_FTS_TABLE)} 
      USING fts5(
        id UNINDEXED, 
        title, 
        body, 
        created_at UNINDEXED, 
        user_updated_at UNINDEXED, 
        tokenize="simple 0",
        content=${sql.table(noteTable.tableName)}
      );
    `.execute(this.engine.db);

    await sql`
      CREATE TRIGGER ${sql.raw(NOTE_FTS_TABLE)}_ai AFTER INSERT ON ${sql.table(noteTable.tableName)}
      BEGIN 
        INSERT INTO ${sql.table(NOTE_FTS_TABLE)} (rowid, title, body) VALUES (new.rowid, new.title, new.body);
      END;`.execute(this.engine.db);

    // prettier-ignore
    await sql`
      CREATE TRIGGER ${sql.raw(NOTE_FTS_TABLE)}_ad AFTER DELETE on ${sql.table(noteTable.tableName)}
      BEGIN
        INSERT INTO ${sql.table(NOTE_FTS_TABLE)} (${sql.raw(NOTE_FTS_TABLE)}, rowid, title, body) VALUES ('delete', old.rowid, old.title, old.body);
      END;`
    .execute(this.engine.db);

    // prettier-ignore
    await sql`
      CREATE TRIGGER ${sql.raw(NOTE_FTS_TABLE)}_au AFTER UPDATE on ${sql.table(noteTable.tableName)}
      BEGIN
        INSERT INTO ${sql.table(NOTE_FTS_TABLE)} (${sql.raw(NOTE_FTS_TABLE)}, rowid, title, body) VALUES ('delete', old.rowid, old.title, old.body);
        INSERT INTO ${sql.table(NOTE_FTS_TABLE)} (rowid, title, body) VALUES (new.rowid, new.title, new.body);
      END;`
    .execute(this.engine.db);
  }

  async search(q: SearchParams) {
    if (!this.engine.db) {
      throw new Error('no db');
    }

    let query = this.engine.db.selectFrom(NOTE_FTS_TABLE).select([
      // prettier-ignore
      sql<string>`snippet(${sql.raw(NOTE_FTS_TABLE)}, 1, '${sql.raw(WRAPPER_START_TEXT)}', '${sql.raw(WRAPPER_END_TEXT)}', '...',  100)`.as('title'),
      // prettier-ignore
      sql<string>`snippet(${sql.raw(NOTE_FTS_TABLE)}, 2, '${sql.raw(WRAPPER_START_TEXT)}', '${sql.raw(WRAPPER_END_TEXT)}', '...',  100)`.as('body'),
      `${NOTE_FTS_TABLE}.id as entityId`,
      `${NOTE_FTS_TABLE}.createdAt`,
      `${NOTE_FTS_TABLE}.rank`,
    ]);

    query = commonSql(query, NOTE_FTS_TABLE, q);

    if (!q.scopes) {
      query = query.where(NOTE_FTS_TABLE, '=', q.keyword);
    } else {
      if (q.scopes.includes(Scopes.Body)) {
        query = query.where(`${NOTE_FTS_TABLE}.body`, 'match', q.keyword);
      }

      if (q.scopes.includes(Scopes.Title)) {
        query = query.where(`${NOTE_FTS_TABLE}.title`, 'match', q.keyword);
      }
    }

    const result = await query.execute();

    return result.map((row) => ({
      ...row,
      entityType: EntityTypes.Note as const,
      title: normalizeTitle(row),
    }));
  }
}
