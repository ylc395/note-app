import { sql } from 'kysely';
import dayjs from 'dayjs';

import { type SearchParams, Scopes } from 'model/search';
import { normalizeTitle } from 'model/memo';
import { EntityTypes } from 'model/entity';

import memoTable from '../schema/memo';
import recyclableTable from '../schema/recyclable';
import type SearchEngine from './index';
import { WRAPPER_END_TEXT, WRAPPER_START_TEXT } from './constants';

export const MEMO_FTS_TABLE = 'memos_fts';

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

    const term = q.terms.join(' ');

    // prettier-ignore
    let query = this.engine.db.selectFrom(MEMO_FTS_TABLE).select([
      sql<string>`snippet(${sql.raw(MEMO_FTS_TABLE)}, 1, '${sql.raw(WRAPPER_START_TEXT)}', '${sql.raw(WRAPPER_END_TEXT)}', '...',  10)`.as('body'),
      'createdAt',
      'id as entityId',
    ]);

    if (!q.recyclables) {
      query = query
        .leftJoin(recyclableTable.tableName, `${recyclableTable.tableName}.entityId`, `${MEMO_FTS_TABLE}.id`)
        .where(`${recyclableTable.tableName}.entityId`, 'is', null);
    }

    if (!q.scopes) {
      query = query.where(MEMO_FTS_TABLE, '=', term);
    } else {
      if (q.scopes.includes(Scopes.Body)) {
        query = query.where(`${MEMO_FTS_TABLE}.content`, 'match', term);
      }
    }

    if (q.created) {
      if (q.created.from) {
        query = query.where(`${MEMO_FTS_TABLE}.createdAt`, '>=', dayjs(q.created.from).valueOf());
      }
      if (q.created.to) {
        query = query.where(`${MEMO_FTS_TABLE}.createdAt`, '<=', dayjs(q.created.to).valueOf());
      }
    }

    if (q.updated) {
      if (q.updated.from) {
        query = query.where(`${MEMO_FTS_TABLE}.userUpdatedAt`, '>=', dayjs(q.updated.from).valueOf());
      }
      if (q.updated.to) {
        query = query.where(`${MEMO_FTS_TABLE}.userUpdatedAt`, '<=', dayjs(q.updated.to).valueOf());
      }
    }

    const result = await query.orderBy(`${MEMO_FTS_TABLE}.rank`).execute();

    return result.map((row) => ({
      body: row.body,
      entityId: row.entityId,
      entityType: EntityTypes.Memo as const,
      title: normalizeTitle(row),
    }));
  }
}
