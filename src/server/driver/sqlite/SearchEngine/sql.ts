import { sql } from 'kysely';
import type { SelectQueryBuilder } from 'kysely';
import dayjs from 'dayjs';

import type { SearchParams } from 'model/search';
import {
  NOTE_FTS_TABLE,
  MEMO_FTS_TABLE,
  FILE_TEXTS_FTS_TABLE,
  MATERIAL_FTS_TABLE,
  MATERIAL_ANNOTATION_FTS_TABLE,
  type SearchEngineDb,
} from './tables';
import { tableName as noteTableName } from '../schema/note';
import { tableName as memoTableName } from '../schema/memo';
import { tableName as materialTableName } from '../schema/material';
import { tableName as fileTextTableName } from '../schema/fileText';
import { tableName as materialAnnotationTableName } from '../schema/materialAnnotation';
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

  sql`CREATE VIRTUAL TABLE ${sql.table(MATERIAL_FTS_TABLE)} 
      USING fts5(
        id UNINDEXED, 
        name,
        created_at UNINDEXED, 
        user_updated_at UNINDEXED, 
        file_id UNINDEXED,
        tokenize="simple 0",
        content=${sql.table(materialTableName)}
      )`,

  sql`CREATE TRIGGER ${sql.raw(MATERIAL_FTS_TABLE)}_ai AFTER INSERT ON ${sql.table(materialTableName)}
      BEGIN 
        INSERT INTO ${sql.table(MATERIAL_FTS_TABLE)} (rowid, name) VALUES (new.rowid, new.name);
      END`,

  sql`CREATE TRIGGER ${sql.raw(MATERIAL_FTS_TABLE)}_ad AFTER DELETE on ${sql.table(materialTableName)}
      BEGIN
        INSERT INTO ${sql.table(MATERIAL_FTS_TABLE)} (${sql.raw(MATERIAL_FTS_TABLE)}, rowid, name) VALUES ('delete', old.rowid, new.name);
      END`,

  sql`CREATE TRIGGER ${sql.raw(MATERIAL_FTS_TABLE)}_au AFTER UPDATE on ${sql.table(materialTableName)}
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
        location UNINDEXED,
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
  
  sql`CREATE VIRTUAL TABLE ${sql.table(MATERIAL_ANNOTATION_FTS_TABLE)} 
      USING fts5(
        id UNINDEXED,
        comment,
        material_id UNINDEXED
        updated_at UNINDEXED,
        created_at UNINDEXED,
        meta UNINDEXED,
        tokenize="simple 0",
        content=${sql.table(materialAnnotationTableName)}
      )`,

  sql`CREATE TRIGGER ${sql.raw(MATERIAL_ANNOTATION_FTS_TABLE)}_ai AFTER INSERT ON ${sql.table(materialAnnotationTableName)}
      BEGIN 
        INSERT INTO ${sql.table(MATERIAL_ANNOTATION_FTS_TABLE)} (rowid, comment) VALUES (new.rowid, new.comment);
      END`,

  sql`CREATE TRIGGER ${sql.raw(MATERIAL_ANNOTATION_FTS_TABLE)}_ad AFTER DELETE on ${sql.table(materialAnnotationTableName)}
      BEGIN
        INSERT INTO ${sql.table(MATERIAL_ANNOTATION_FTS_TABLE)} (${sql.raw(MATERIAL_ANNOTATION_FTS_TABLE)}, rowid, comment) VALUES ('delete', old.rowid, old.comment);
      END`,

  sql`CREATE TRIGGER ${sql.raw(MATERIAL_ANNOTATION_FTS_TABLE)}_au AFTER UPDATE on ${sql.table(materialAnnotationTableName)}
      BEGIN
        INSERT INTO ${sql.table(MATERIAL_ANNOTATION_FTS_TABLE)} (${sql.raw(MATERIAL_ANNOTATION_FTS_TABLE)}, rowid, comment) VALUES ('delete', old.rowid, new.comment);
        INSERT INTO ${sql.table(MATERIAL_ANNOTATION_FTS_TABLE)} (rowid, comment) VALUES (new.rowid, new.comment);
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
