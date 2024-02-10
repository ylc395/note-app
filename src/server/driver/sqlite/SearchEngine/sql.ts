import { sql } from 'kysely';
import type { SelectQueryBuilder } from 'kysely';
import dayjs from 'dayjs';

import type { SearchParams } from '@domain/model/search.js';
import {
  NOTE_FTS_TABLE,
  MEMO_FTS_TABLE,
  FILE_TEXTS_FTS_TABLE,
  MATERIAL_FTS_TABLE,
  ANNOTATION_FTS_TABLE,
  type SearchEngineDb,
} from './tables.js';
import { tableName as noteTableName } from '../schema/note.js';
import { tableName as memoTableName } from '../schema/memo.js';
import { tableName as materialTableName } from '../schema/material.js';
import { tableName as fileTextTableName } from '../schema/fileText.js';
import { tableName as annotationTableName } from '../schema/annotation.js';
import { tableName as recyclableTableName } from '../schema/recyclable.js';

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
        content=${sql.table(noteTableName)}
      )`,

  sql`CREATE TRIGGER ${sql.raw(NOTE_FTS_TABLE)}_ai AFTER INSERT ON ${sql.table(noteTableName)}
      BEGIN 
        INSERT INTO ${sql.table(NOTE_FTS_TABLE)} (rowid, title, body) VALUES (new.rowid, new.title, new.body);
      END`,

  sql`CREATE TRIGGER ${sql.raw(NOTE_FTS_TABLE)}_ad AFTER DELETE on ${sql.table(noteTableName)}
      BEGIN
        INSERT INTO ${sql.table(NOTE_FTS_TABLE)} (${sql.raw(NOTE_FTS_TABLE)}, rowid, title, body) VALUES ('delete', old.rowid, old.title, old.body);
      END`,

  sql`CREATE TRIGGER ${sql.raw(NOTE_FTS_TABLE)}_au AFTER UPDATE on ${sql.table(noteTableName)}
      BEGIN
        INSERT INTO ${sql.table(NOTE_FTS_TABLE)} (${sql.raw(NOTE_FTS_TABLE)}, rowid, title, body) VALUES ('delete', old.rowid, old.title, old.body);
        INSERT INTO ${sql.table(NOTE_FTS_TABLE)} (rowid, title, body) VALUES (new.rowid, new.title, new.body);
      END`,

  // sql`CREATE VIRTUAL TABLE ${sql.table(MATERIAL_FTS_TABLE)} 
  //     USING fts5(
  //       id UNINDEXED, 
  //       title,
  //       comment,
  //       created_at UNINDEXED, 
  //       user_updated_at UNINDEXED, 
  //       file_id UNINDEXED,
  //       tokenize="simple 0",
  //       content=${sql.table(materialTableName)}
  //     )`,

  // sql`CREATE TRIGGER ${sql.raw(MATERIAL_FTS_TABLE)}_ai AFTER INSERT ON ${sql.table(materialTableName)}
  //     BEGIN 
  //       INSERT INTO ${sql.table(MATERIAL_FTS_TABLE)} (rowid, title) VALUES (new.rowid, new.title);
  //     END`,

  // sql`CREATE TRIGGER ${sql.raw(MATERIAL_FTS_TABLE)}_ad AFTER DELETE on ${sql.table(materialTableName)}
  //     BEGIN
  //       INSERT INTO ${sql.table(MATERIAL_FTS_TABLE)} (${sql.raw(MATERIAL_FTS_TABLE)}, rowid, title) VALUES ('delete', old.rowid, new.title);
  //     END`,

  // sql`CREATE TRIGGER ${sql.raw(MATERIAL_FTS_TABLE)}_au AFTER UPDATE on ${sql.table(materialTableName)}
  //     BEGIN
  //       INSERT INTO ${sql.table(MATERIAL_FTS_TABLE)} (${sql.raw(MATERIAL_FTS_TABLE)}, rowid, title) VALUES ('delete', old.rowid, new.title);
  //       INSERT INTO ${sql.table(MATERIAL_FTS_TABLE)} (rowid, title) VALUES (new.rowid, new.title);
  //     END`,

  sql`CREATE VIRTUAL TABLE ${sql.table(MEMO_FTS_TABLE)} 
      USING fts5(
        id UNINDEXED, 
        content,
        created_at UNINDEXED, 
        user_updated_at UNINDEXED, 
        tokenize="simple 0",
        content=${sql.table(memoTableName)}
      )`,

  sql`CREATE TRIGGER ${sql.raw(MEMO_FTS_TABLE)}_ai AFTER INSERT ON ${sql.table(memoTableName)}
      BEGIN 
        INSERT INTO ${sql.table(MEMO_FTS_TABLE)} (rowid, content) VALUES (new.rowid, new.content);
      END`,

  sql`CREATE TRIGGER ${sql.raw(MEMO_FTS_TABLE)}_ad AFTER DELETE on ${sql.table(memoTableName)}
      BEGIN
        INSERT INTO ${sql.table(MEMO_FTS_TABLE)} (${sql.raw(MEMO_FTS_TABLE)}, rowid, content) VALUES ('delete', old.rowid, new.content);
      END`,

  sql`CREATE TRIGGER ${sql.raw(MEMO_FTS_TABLE)}_au AFTER UPDATE on ${sql.table(memoTableName)}
      BEGIN
        INSERT INTO ${sql.table(MEMO_FTS_TABLE)} (${sql.raw(MEMO_FTS_TABLE)}, rowid, content) VALUES ('delete', old.rowid, new.content);
        INSERT INTO ${sql.table(MEMO_FTS_TABLE)} (rowid, content) VALUES (new.rowid, new.content);
      END`,

  sql`CREATE VIRTUAL TABLE ${sql.table(FILE_TEXTS_FTS_TABLE)} 
      USING fts5(
        file_id UNINDEXED,
        text,
        page UNINDEXED,
        tokenize="simple 0",
        content=${sql.table(fileTextTableName)}
      )`,

  sql`CREATE TRIGGER ${sql.raw(FILE_TEXTS_FTS_TABLE)}_ai AFTER INSERT ON ${sql.table(fileTextTableName)}
      BEGIN 
        INSERT INTO ${sql.table(FILE_TEXTS_FTS_TABLE)} (rowid, text) VALUES (new.rowid, new.text);
      END`,

  sql`CREATE TRIGGER ${sql.raw(FILE_TEXTS_FTS_TABLE)}_ad AFTER DELETE on ${sql.table(fileTextTableName)}
      BEGIN
        INSERT INTO ${sql.table(FILE_TEXTS_FTS_TABLE)} (${sql.raw(FILE_TEXTS_FTS_TABLE)}, rowid, text) VALUES ('delete', old.rowid, old.text);
      END`,

  sql`CREATE TRIGGER ${sql.raw(FILE_TEXTS_FTS_TABLE)}_au AFTER UPDATE on ${sql.table(fileTextTableName)}
      BEGIN
        INSERT INTO ${sql.table(FILE_TEXTS_FTS_TABLE)} (${sql.raw(FILE_TEXTS_FTS_TABLE)}, rowid, text) VALUES ('delete', old.rowid, new.text);
        INSERT INTO ${sql.table(FILE_TEXTS_FTS_TABLE)} (rowid, text) VALUES (new.rowid, new.text);
      END;`,
];

export function commonSql(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  qb: SelectQueryBuilder<SearchEngineDb, any, any>,
  table:
    | typeof MATERIAL_FTS_TABLE
    | typeof materialTableName
    | typeof NOTE_FTS_TABLE
    | typeof noteTableName
    | typeof MEMO_FTS_TABLE
    | typeof ANNOTATION_FTS_TABLE
    | typeof annotationTableName
    | typeof memoTableName,
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
      qb = qb.where(`${table}.updatedAt`, '>=', dayjs(query.updated.from).valueOf());
    }
    if (query.updated.to) {
      qb = qb.where(`${table}.updatedAt`, '<=', dayjs(query.updated.to).valueOf());
    }
  }

  return qb;
}
