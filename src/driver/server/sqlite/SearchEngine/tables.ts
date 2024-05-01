import { sql } from 'kysely';

import { type Row as FileTextRow, tableName as fileTextTableName } from '../schema/fileText.js';
import { tableName as noteTableName, type Row as NoteRow } from '../schema/note.js';
import { tableName as materialTableName, type Row as MaterialRow } from '../schema/material.js';
import { tableName as memoTableName, type Row as MemoRow } from '../schema/memo.js';
import { tableName as annotationTableName, type Row as AnnotationRow } from '../schema/annotation.js';
import type { Db } from '../Database.js';

export const WRAPPER_START_TEXT = '__%START%__';
export const WRAPPER_END_TEXT = '__%END%__';

export const notesFTSTableName = 'notes_fts';
export const materialsFTSTableName = 'materials_fts';
export const memosFTSTableName = 'memos_fts';
export const annotationsFTSTableName = 'annotations_fts';
export const fileTextsFTSTableName = 'file_texts_fts';

interface FtsRow {
  rank: number;
}

export interface SearchEngineDb extends Db {
  [fileTextsFTSTableName]: FtsRow & FileTextRow & { [fileTextsFTSTableName]: string };
  [notesFTSTableName]: FtsRow & NoteRow & { [notesFTSTableName]: string };
  [materialsFTSTableName]: FtsRow & MaterialRow & { [materialsFTSTableName]: string };
  [memosFTSTableName]: FtsRow & MemoRow & { [memosFTSTableName]: string };
  [annotationsFTSTableName]: FtsRow & AnnotationRow & { [annotationsFTSTableName]: string };
}

// prettier-ignore
export const initialSqls =  [
  sql`
      CREATE VIRTUAL TABLE ${sql.table(notesFTSTableName)} 
      USING fts5(
        id UNINDEXED, 
        title, 
        body, 
        icon UNINDEXED,
        created_at UNINDEXED, 
        updated_at UNINDEXED, 
        tokenize="simple",
        content=${sql.table(noteTableName)}
      )`,

  sql`
      CREATE VIRTUAL TABLE ${sql.table(materialsFTSTableName)} 
      USING fts5(
        id UNINDEXED, 
        title, 
        comment, 
        icon UNINDEXED,
        file_id UNINDEXED,
        created_at UNINDEXED, 
        updated_at UNINDEXED, 
        tokenize="simple",
        content=${sql.table(materialTableName)}
      )`,

  sql`
      CREATE VIRTUAL TABLE ${sql.table(memosFTSTableName)} 
      USING fts5(
        id UNINDEXED, 
        body, 
        created_at UNINDEXED, 
        updated_at UNINDEXED, 
        tokenize="simple",
        content=${sql.table(memoTableName)}
      )`,

  sql`CREATE VIRTUAL TABLE ${sql.table(annotationsFTSTableName)} 
      USING fts5(
        id UNINDEXED,
        target_id UNINDEXED,
        target_text UNINDEXED,
        body,
        created_at UNINDEXED, 
        updated_at UNINDEXED, 
        tokenize="simple",
        content=${sql.table(fileTextTableName)}
    )`,

  sql`CREATE VIRTUAL TABLE ${sql.table(fileTextsFTSTableName)} 
      USING fts5(
        file_id UNINDEXED,
        text,
        location UNINDEXED,
        tokenize="simple",
        content=${sql.table(fileTextTableName)}
      )`,

  sql`CREATE TRIGGER notes_ai AFTER INSERT ON ${sql.table(noteTableName)}
      BEGIN 
        INSERT INTO ${sql.table(notesFTSTableName)}(rowid, title, body) VALUES (new.rowid, new.title, new.body);
      END`,

  sql`CREATE TRIGGER notes_ad AFTER DELETE on ${sql.table(noteTableName)}
      BEGIN
        INSERT INTO ${sql.table(notesFTSTableName)}(${sql.raw(notesFTSTableName)}, rowid, title, body) VALUES ('delete', old.rowid, old.title, old.body);
      END`,

  sql`CREATE TRIGGER notes_au AFTER UPDATE on ${sql.table(noteTableName)}
      BEGIN
        INSERT INTO ${sql.table(notesFTSTableName)}(${sql.raw(notesFTSTableName)}, rowid, title, body) VALUES ('delete', old.rowid, old.title, old.body);
        INSERT INTO ${sql.table(notesFTSTableName)}(rowid, title, body) VALUES (new.rowid, new.title, new.body);
      END`,

  sql`CREATE TRIGGER materials_ai AFTER INSERT ON ${sql.table(materialTableName)}
      BEGIN 
        INSERT INTO ${sql.table(materialsFTSTableName)}(rowid, title, comment) VALUES (new.rowid, new.title, new.comment);
      END`,

  sql`CREATE TRIGGER materials_ad AFTER DELETE on ${sql.table(materialTableName)}
      BEGIN
        INSERT INTO ${sql.table(materialsFTSTableName)}(${sql.raw(materialsFTSTableName)}, rowid, title, comment) VALUES ('delete', old.rowid, old.title, old.comment);
      END`,

  sql`CREATE TRIGGER materials_au AFTER UPDATE on ${sql.table(materialTableName)}
      BEGIN
        INSERT INTO ${sql.table(materialsFTSTableName)}(${sql.raw(materialsFTSTableName)}, rowid, title, comment) VALUES ('delete', old.rowid, old.title, old.comment);
        INSERT INTO ${sql.table(materialsFTSTableName)}(rowid, title, comment) VALUES (new.rowid, new.title, new.comment);
      END`,

  sql`CREATE TRIGGER memos_ai AFTER INSERT ON ${sql.table(memoTableName)}
      BEGIN 
        INSERT INTO ${sql.table(memosFTSTableName)}(rowid, body) VALUES (new.rowid, new.body);
      END`,

  sql`CREATE TRIGGER memos_ad AFTER DELETE on ${sql.table(memoTableName)}
      BEGIN
        INSERT INTO ${sql.table(memosFTSTableName)}(${sql.table(memosFTSTableName)}, rowid, body) VALUES ('delete', old.rowid, old.body);
      END`,

  sql`CREATE TRIGGER memos_au AFTER UPDATE on ${sql.table(memoTableName)}
      BEGIN
        INSERT INTO ${sql.table(memosFTSTableName)}(${sql.raw(memosFTSTableName)}, rowid, body) VALUES ('delete', old.rowid, new.body);
        INSERT INTO ${sql.table(memosFTSTableName)}(rowid, body) VALUES (new.rowid, new.body);
      END`,

  sql`CREATE TRIGGER annotations_ai AFTER INSERT ON ${sql.table(annotationTableName)}
      BEGIN 
        INSERT INTO ${sql.table(annotationsFTSTableName)}(rowid, body) VALUES (new.rowid, new.body);
      END`,

  sql`CREATE TRIGGER annotations_ad AFTER DELETE on ${sql.table(annotationTableName)}
      BEGIN
        INSERT INTO ${sql.table(annotationsFTSTableName)}(${sql.table(annotationsFTSTableName)}, rowid, body) VALUES ('delete', old.rowid, old.body);
      END`,

  sql`CREATE TRIGGER annotations_au AFTER UPDATE on ${sql.table(annotationTableName)}
      BEGIN
        INSERT INTO ${sql.table(annotationsFTSTableName)}(${sql.raw(annotationsFTSTableName)}, rowid, body) VALUES ('delete', old.rowid, new.body);
        INSERT INTO ${sql.table(annotationsFTSTableName)}(rowid, body) VALUES (new.rowid, new.body);
      END`,

  sql`CREATE TRIGGER file_texts_ai AFTER INSERT ON ${sql.table(fileTextTableName)}
      BEGIN 
        INSERT INTO ${sql.table(fileTextsFTSTableName)}(rowid, text) VALUES (new.rowid, new.text);
      END`,

  sql`CREATE TRIGGER file_texts_ad AFTER DELETE on ${sql.table(fileTextTableName)}
      BEGIN
        INSERT INTO ${sql.table(fileTextsFTSTableName)}(${sql.table(fileTextsFTSTableName)}, rowid, text) VALUES ('delete', old.rowid, old.text);
      END`,

  sql`CREATE TRIGGER file_texts_au AFTER UPDATE on ${sql.table(fileTextTableName)}
      BEGIN
        INSERT INTO ${sql.table(fileTextsFTSTableName)}(${sql.table(fileTextsFTSTableName)}, rowid, text) VALUES ('delete', old.rowid, new.text);
        INSERT INTO ${sql.table(fileTextsFTSTableName)}(rowid, text) VALUES (new.rowid, new.text);
      END;`,

];
