import { sql } from 'kysely';
import dayjs from 'dayjs';

import { type SearchParams, Scopes } from 'model/search';
import { EntityTypes } from 'model/entity';

import noteTable from '../schema/note';
import recyclableTable from '../schema/recyclable';
import type SearchEngine from './index';
import { NOTE_FTS_TABLE, WRAPPER_END_TEXT, WRAPPER_START_TEXT } from './tables';

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

    const term = q.terms.join(' ');

    let query = this.engine.db.selectFrom(NOTE_FTS_TABLE).select([
      // prettier-ignore
      sql<string>`snippet(${sql.raw(NOTE_FTS_TABLE)}, 1, '${sql.raw(WRAPPER_START_TEXT)}', '${sql.raw(WRAPPER_END_TEXT)}', '...',  10)`.as('title'),
      // prettier-ignore
      sql<string>`snippet(${sql.raw(NOTE_FTS_TABLE)}, 2, '${sql.raw(WRAPPER_START_TEXT)}', '${sql.raw(WRAPPER_END_TEXT)}', '...',  10)`.as('body'),
      'id as entityId',
    ]);

    if (!q.recyclables) {
      query = query
        .leftJoin(recyclableTable.tableName, `${recyclableTable.tableName}.entityId`, `${NOTE_FTS_TABLE}.id`)
        .where(`${recyclableTable.tableName}.entityId`, 'is', null);
    }

    if (!q.scopes) {
      query = query.where(NOTE_FTS_TABLE, '=', term);
    } else {
      if (q.scopes.includes(Scopes.Body)) {
        query = query.where(`${NOTE_FTS_TABLE}.body`, 'match', term);
      }

      if (q.scopes.includes(Scopes.Title)) {
        query = query.where(`${NOTE_FTS_TABLE}.title`, 'match', term);
      }
    }

    if (q.created) {
      if (q.created.from) {
        query = query.where(`${NOTE_FTS_TABLE}.createdAt`, '>=', dayjs(q.created.from).valueOf());
      }
      if (q.created.to) {
        query = query.where(`${NOTE_FTS_TABLE}.createdAt`, '<=', dayjs(q.created.to).valueOf());
      }
    }

    if (q.updated) {
      if (q.updated.from) {
        query = query.where(`${NOTE_FTS_TABLE}.userUpdatedAt`, '>=', dayjs(q.updated.from).valueOf());
      }
      if (q.updated.to) {
        query = query.where(`${NOTE_FTS_TABLE}.userUpdatedAt`, '<=', dayjs(q.updated.to).valueOf());
      }
    }

    const result = await query.orderBy(`${NOTE_FTS_TABLE}.rank`).execute();

    return result.map((row) => ({ ...row, entityType: EntityTypes.Note as const }));
  }
}
