import { sql } from 'kysely';
import dayjs from 'dayjs';
import compact from 'lodash/compact';

import { type SearchParams, Scopes } from 'model/search';
import { normalizeEntityTitle } from 'model/material';
import { EntityTypes } from 'model/entity';

import materialTable from '../schema/material';
import fileTextTable from '../schema/fileText';
import recyclableTable from '../schema/recyclable';
import type SearchEngine from './index';
import { WRAPPER_END_TEXT, WRAPPER_START_TEXT } from './constants';

export const FILE_TEXTS_FTS_TABLE = 'file_texts_fts';

export default class SqliteNoteSearchEngine {
  constructor(private readonly engine: SearchEngine) {}

  async createFtsTable() {
    if (this.engine.sqliteDb.hasTable(FILE_TEXTS_FTS_TABLE)) {
      return;
    }

    await sql`
      CREATE VIRTUAL TABLE ${sql.table(FILE_TEXTS_FTS_TABLE)} 
      USING fts5(
        fileId UNINDEXED,
        text,
        page UNINDEXED,
        location UNINDEXED,
        content=${sql.table(fileTextTable.tableName)}
      );
    `.execute(this.engine.db);

    await sql`
      CREATE TRIGGER ${sql.raw(FILE_TEXTS_FTS_TABLE)}_ai AFTER INSERT ON ${sql.table(fileTextTable.tableName)}
      BEGIN 
        INSERT INTO ${sql.table(FILE_TEXTS_FTS_TABLE)} (rowid, text) VALUES (new.rowid, new.text);
      END;`.execute(this.engine.db);

    // prettier-ignore
    await sql`
      CREATE TRIGGER ${sql.raw(FILE_TEXTS_FTS_TABLE)}_ad AFTER DELETE on ${sql.table(fileTextTable.tableName)}
      BEGIN
        INSERT INTO ${sql.table(FILE_TEXTS_FTS_TABLE)} (${sql.raw(FILE_TEXTS_FTS_TABLE)}, rowid, text) VALUES ('delete', old.rowid, old.text);
      END;`.execute(this.engine.db);

    // prettier-ignore
    await sql`
      CREATE TRIGGER ${sql.raw(FILE_TEXTS_FTS_TABLE)}_au AFTER UPDATE on ${sql.table(fileTextTable.tableName)}
      BEGIN
        INSERT INTO ${sql.table(FILE_TEXTS_FTS_TABLE)} (${sql.raw(FILE_TEXTS_FTS_TABLE)}, rowid, text) VALUES ('delete', old.rowid, new.text);
        INSERT INTO ${sql.table(FILE_TEXTS_FTS_TABLE)} (rowid, text) VALUES (new.rowid, new.text);
      END;`
    .execute(this.engine.db);
  }

  async search(q: SearchParams) {
    if (!this.engine.db) {
      throw new Error('no db');
    }

    const term = q.terms.join(' ');

    // prettier-ignore
    let query = this.engine.db.selectFrom(FILE_TEXTS_FTS_TABLE)
    .innerJoin(materialTable.tableName, `${materialTable.tableName}.fileId`, `${FILE_TEXTS_FTS_TABLE}.fileId`)
    .select(eb => [
      sql<string>`snippet(${sql.raw(FILE_TEXTS_FTS_TABLE)}, 1, '${sql.raw(WRAPPER_START_TEXT)}', '${sql.raw(WRAPPER_END_TEXT)}', '...',  10)`.as('body'),
      `${materialTable.tableName}.id as entityId`,
      `${materialTable.tableName}.createdAt`,
      // https://www.sqlite.org/lang_select.html#bareagg
      eb.fn.max(`${FILE_TEXTS_FTS_TABLE}.rank`).as('rank'),
    ])

    if (!q.recyclables) {
      query = query
        .leftJoin(recyclableTable.tableName, `${recyclableTable.tableName}.entityId`, `${materialTable.tableName}.id`)
        .where(`${recyclableTable.tableName}.entityId`, 'is', null);
    }

    query = query.where((eb) => {
      const scopes = q.scopes || [Scopes.Title, Scopes.Body];

      return eb.or(
        compact([
          scopes.includes(Scopes.Body) && eb(`${FILE_TEXTS_FTS_TABLE}.text`, 'match', term),
          scopes.includes(Scopes.Title) && eb(`${materialTable.tableName}.name`, 'like', `%${term}%`),
        ]),
      );
    });

    if (q.created) {
      if (q.created.from) {
        query = query.where(`${materialTable.tableName}.createdAt`, '>=', dayjs(q.created.from).valueOf());
      }
      if (q.created.to) {
        query = query.where(`${materialTable.tableName}.createdAt`, '<=', dayjs(q.created.to).valueOf());
      }
    }

    if (q.updated) {
      if (q.updated.from) {
        query = query.where(`${materialTable.tableName}.userUpdatedAt`, '>=', dayjs(q.updated.from).valueOf());
      }
      if (q.updated.to) {
        query = query.where(`${materialTable.tableName}.userUpdatedAt`, '<=', dayjs(q.updated.to).valueOf());
      }
    }

    const result = await query.groupBy(`${materialTable.tableName}.id`).execute();

    return result.map((row) => ({
      body: row.body,
      entityId: row.entityId,
      entityType: EntityTypes.Memo as const,
      title: normalizeEntityTitle(row),
    }));
  }
}
