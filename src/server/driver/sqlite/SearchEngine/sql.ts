import { sql } from 'kysely';
import type { SelectQueryBuilder } from 'kysely';
import dayjs from 'dayjs';

import type { SearchParams } from 'model/search';
import {
  NOTE_FTS_TABLE,
  MEMO_FTS_TABLE,
  FILE_TEXTS_FTS_TABLE,
  MATERIAL_FTS_TABLE,
  type SearchEngineDb,
} from './tables';
import noteTable from '../schema/note';
import memoTable from '../schema/memo';
import materialTable from '../schema/material';
import fileTextTable from '../schema/fileText';
import { tableName as recyclableTableName } from '../schema/recyclable';

// prettier-ignore
export const createFtsSql = [
  sql`
      CREATE VIRTUAL TABLE ${sql.table(NOTE_FTS_TABLE)} 
      USING fts5(
        id UNINDEXED, 
        title, 
        body, 
        created_at UNINDEXED, 
        user_updated_at UNINDEXED, 
        tokenize="simple 0",
        content=${sql.table(noteTable.tableName)}
      )`,

  sql`CREATE TRIGGER ${sql.raw(NOTE_FTS_TABLE)}_ai AFTER INSERT ON ${sql.table(noteTable.tableName)}
      BEGIN 
        INSERT INTO ${sql.table(NOTE_FTS_TABLE)} (rowid, title, body) VALUES (new.rowid, new.title, new.body);
      END`,

  sql`CREATE TRIGGER ${sql.raw(NOTE_FTS_TABLE)}_ad AFTER DELETE on ${sql.table(noteTable.tableName)}
      BEGIN
        INSERT INTO ${sql.table(NOTE_FTS_TABLE)} (${sql.raw(NOTE_FTS_TABLE)}, rowid, title, body) VALUES ('delete', old.rowid, old.title, old.body);
      END`,

  sql`CREATE TRIGGER ${sql.raw(NOTE_FTS_TABLE)}_au AFTER UPDATE on ${sql.table(noteTable.tableName)}
      BEGIN
        INSERT INTO ${sql.table(NOTE_FTS_TABLE)} (${sql.raw(NOTE_FTS_TABLE)}, rowid, title, body) VALUES ('delete', old.rowid, old.title, old.body);
        INSERT INTO ${sql.table(NOTE_FTS_TABLE)} (rowid, title, body) VALUES (new.rowid, new.title, new.body);
      END`,

  sql`CREATE VIRTUAL TABLE ${sql.table(MATERIAL_FTS_TABLE)} 
      USING fts5(
        id UNINDEXED, 
        name,
        created_at UNINDEXED, 
        user_updated_at UNINDEXED, 
        file_id UNINDEXED,
        tokenize="simple 0",
        content=${sql.table(materialTable.tableName)}
      )`,

  sql`CREATE TRIGGER ${sql.raw(MATERIAL_FTS_TABLE)}_ai AFTER INSERT ON ${sql.table(materialTable.tableName)}
      BEGIN 
        INSERT INTO ${sql.table(MATERIAL_FTS_TABLE)} (rowid, name) VALUES (new.rowid, new.name);
      END`,

  sql`CREATE TRIGGER ${sql.raw(MATERIAL_FTS_TABLE)}_ad AFTER DELETE on ${sql.table(materialTable.tableName)}
      BEGIN
        INSERT INTO ${sql.table(MATERIAL_FTS_TABLE)} (${sql.raw(MATERIAL_FTS_TABLE)}, rowid, name) VALUES ('delete', old.rowid, new.name);
      END`,

  sql`CREATE TRIGGER ${sql.raw(MATERIAL_FTS_TABLE)}_au AFTER UPDATE on ${sql.table(materialTable.tableName)}
      BEGIN
        INSERT INTO ${sql.table(MATERIAL_FTS_TABLE)} (${sql.raw(MATERIAL_FTS_TABLE)}, rowid, name) VALUES ('delete', old.rowid, new.name);
        INSERT INTO ${sql.table(MATERIAL_FTS_TABLE)} (rowid, name) VALUES (new.rowid, new.name);
      END`,

  sql`CREATE VIRTUAL TABLE ${sql.table(MEMO_FTS_TABLE)} 
      USING fts5(
        id UNINDEXED, 
        content,
        created_at UNINDEXED, 
        user_updated_at UNINDEXED, 
        tokenize="simple 0",
        content=${sql.table(memoTable.tableName)}
      )`,

  sql`CREATE TRIGGER ${sql.raw(MEMO_FTS_TABLE)}_ai AFTER INSERT ON ${sql.table(memoTable.tableName)}
      BEGIN 
        INSERT INTO ${sql.table(MEMO_FTS_TABLE)} (rowid, content) VALUES (new.rowid, new.content);
      END`,

  sql`CREATE TRIGGER ${sql.raw(MEMO_FTS_TABLE)}_ad AFTER DELETE on ${sql.table(memoTable.tableName)}
      BEGIN
        INSERT INTO ${sql.table(MEMO_FTS_TABLE)} (${sql.raw(MEMO_FTS_TABLE)}, rowid, content) VALUES ('delete', old.rowid, new.content);
      END`,

  sql`CREATE TRIGGER ${sql.raw(MEMO_FTS_TABLE)}_au AFTER UPDATE on ${sql.table(memoTable.tableName)}
      BEGIN
        INSERT INTO ${sql.table(MEMO_FTS_TABLE)} (${sql.raw(MEMO_FTS_TABLE)}, rowid, content) VALUES ('delete', old.rowid, new.content);
        INSERT INTO ${sql.table(MEMO_FTS_TABLE)} (rowid, content) VALUES (new.rowid, new.content);
      END`,

  sql`CREATE VIRTUAL TABLE ${sql.table(FILE_TEXTS_FTS_TABLE)} 
      USING fts5(
        file_id UNINDEXED,
        text,
        page UNINDEXED,
        location UNINDEXED,
        tokenize="simple 0",
        content=${sql.table(fileTextTable.tableName)}
      )`,

  sql`CREATE TRIGGER ${sql.raw(FILE_TEXTS_FTS_TABLE)}_ai AFTER INSERT ON ${sql.table(fileTextTable.tableName)}
      BEGIN 
        INSERT INTO ${sql.table(FILE_TEXTS_FTS_TABLE)} (rowid, text) VALUES (new.rowid, new.text);
      END`,

  sql`CREATE TRIGGER ${sql.raw(FILE_TEXTS_FTS_TABLE)}_ad AFTER DELETE on ${sql.table(fileTextTable.tableName)}
      BEGIN
        INSERT INTO ${sql.table(FILE_TEXTS_FTS_TABLE)} (${sql.raw(FILE_TEXTS_FTS_TABLE)}, rowid, text) VALUES ('delete', old.rowid, old.text);
      END`,

  sql`CREATE TRIGGER ${sql.raw(FILE_TEXTS_FTS_TABLE)}_au AFTER UPDATE on ${sql.table(fileTextTable.tableName)}
      BEGIN
        INSERT INTO ${sql.table(FILE_TEXTS_FTS_TABLE)} (${sql.raw(FILE_TEXTS_FTS_TABLE)}, rowid, text) VALUES ('delete', old.rowid, new.text);
        INSERT INTO ${sql.table(FILE_TEXTS_FTS_TABLE)} (rowid, text) VALUES (new.rowid, new.text);
      END;`,
];

export function commonSql(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  qb: SelectQueryBuilder<SearchEngineDb, any, any>,
  table: typeof MATERIAL_FTS_TABLE | typeof NOTE_FTS_TABLE | typeof MEMO_FTS_TABLE,
  query: SearchParams,
) {
  if (!query.recyclables) {
    qb = qb
      .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${table}.id`)
      .where(`${recyclableTableName}.entityId`, 'is', null);
  }

  if (query.created) {
    if (query.created.from) {
      qb = qb.where(`${table}.createdAt`, '>=', dayjs(query.created.from).valueOf());
    }
    if (query.created.to) {
      qb = qb.where(`${table}.createdAt`, '<=', dayjs(query.created.to).valueOf());
    }
  }

  if (query.updated) {
    if (query.updated.from) {
      qb = qb.where(`${table}.userUpdatedAt`, '>=', dayjs(query.updated.from).valueOf());
    }
    if (query.updated.to) {
      qb = qb.where(`${table}.userUpdatedAt`, '<=', dayjs(query.updated.to).valueOf());
    }
  }

  return qb;
}
