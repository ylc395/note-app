import { sql } from 'kysely';

import { type SearchParams, Scopes } from 'model/search';
import { normalizeTitle } from 'model/memo';
import { EntityTypes } from 'model/entity';

import memoTable from '../schema/memo';
import type SearchEngine from './index';
import { MEMO_FTS_TABLE, WRAPPER_END_TEXT, WRAPPER_START_TEXT, commonSql } from './tables';

export default class SqliteNoteSearchEngine {
  constructor(private readonly engine: SearchEngine) {}

  async createFtsTable() {
    if (this.engine.sqliteDb.hasTable(MEMO_FTS_TABLE)) {
      return;
    }

    await sql`
      CREATE VIRTUAL TABLE ${sql.table(MEMO_FTS_TABLE)} 
      USING fts5(
        id UNINDEXED, 
        content,
        created_at UNINDEXED, 
        user_updated_at UNINDEXED, 
        tokenize="simple 0",
        content=${sql.table(memoTable.tableName)}
      );
    `.execute(this.engine.db);

    await sql`
      CREATE TRIGGER ${sql.raw(MEMO_FTS_TABLE)}_ai AFTER INSERT ON ${sql.table(memoTable.tableName)}
      BEGIN 
        INSERT INTO ${sql.table(MEMO_FTS_TABLE)} (rowid, content) VALUES (new.rowid, new.content);
      END;`.execute(this.engine.db);

    // prettier-ignore
    await sql`
      CREATE TRIGGER ${sql.raw(MEMO_FTS_TABLE)}_ad AFTER DELETE on ${sql.table(memoTable.tableName)}
      BEGIN
        INSERT INTO ${sql.table(MEMO_FTS_TABLE)} (${sql.raw(MEMO_FTS_TABLE)}, rowid, content) VALUES ('delete', old.rowid, new.content);
      END;`.execute(this.engine.db);

    // prettier-ignore
    await sql`
      CREATE TRIGGER ${sql.raw(MEMO_FTS_TABLE)}_au AFTER UPDATE on ${sql.table(memoTable.tableName)}
      BEGIN
        INSERT INTO ${sql.table(MEMO_FTS_TABLE)} (${sql.raw(MEMO_FTS_TABLE)}, rowid, content) VALUES ('delete', old.rowid, new.content);
        INSERT INTO ${sql.table(MEMO_FTS_TABLE)} (rowid, content) VALUES (new.rowid, new.content);
      END;`
    .execute(this.engine.db);
  }

  async search(q: SearchParams) {
    if (!this.engine.db) {
      throw new Error('no db');
    }

    // prettier-ignore
    let query = this.engine.db.selectFrom(MEMO_FTS_TABLE).select([
      sql<string>`snippet(${sql.raw(MEMO_FTS_TABLE)}, 1, '${sql.raw(WRAPPER_START_TEXT)}', '${sql.raw(WRAPPER_END_TEXT)}', '...',  10)`.as('body'),
      `${MEMO_FTS_TABLE}.createdAt`,
      `${MEMO_FTS_TABLE}.id as entityId`,
      `${MEMO_FTS_TABLE}.rank`,
    ]);

    query = commonSql(query, MEMO_FTS_TABLE, q);

    if (!q.scopes) {
      query = query.where(MEMO_FTS_TABLE, '=', q.keyword);
    } else {
      if (q.scopes.includes(Scopes.Body)) {
        query = query.where(`${MEMO_FTS_TABLE}.content`, 'match', q.keyword);
      }
    }

    const result = await query.execute();

    return result.map((row) => ({
      ...row,
      entityType: EntityTypes.Memo as const,
      title: normalizeTitle(row),
    }));
  }
}
