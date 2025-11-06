import { sql } from 'kysely';

import { type Row as FileTextRow, tableName as fileTextTableName } from '../schema/fileText.js';
import { tableName as noteTableName, type Row as NoteRow } from '../schema/note.js';
import { tableName as memoTableName, type Row as MemoRow } from '../schema/memo.js';
import { tableName as annotationTableName, type Row as AnnotationRow } from '../schema/annotation.js';
import type { Schemas } from '../schema/index.js';

export const WRAPPER_START_TEXT = '__%START%__';
export const WRAPPER_END_TEXT = '__%END%__';

export const notesFTSTableName = 'notes_fts';
export const memosFTSTableName = 'memos_fts';
export const annotationsFTSTableName = 'annotations_fts';
export const fileTextsFTSTableName = 'file_texts_fts';

interface FtsRow {
  rank: number;
}

// prettier-ignore
export interface SearchEngineDb extends Schemas {
  [fileTextsFTSTableName]: FtsRow & FileTextRow & { [fileTextsFTSTableName]: string };
  [notesFTSTableName]: FtsRow & Pick<NoteRow, 'id' | 'title' | 'body' | 'fileId'> & { [notesFTSTableName]: string };
  [memosFTSTableName]: FtsRow & Pick<MemoRow, 'id' | 'body'> & { [memosFTSTableName]: string };
  [annotationsFTSTableName]: FtsRow & Pick<AnnotationRow, 'id' | 'targetId' | 'body'> & { [annotationsFTSTableName]: string };
}

// prettier-ignore
export const initialSqls =  [
  {
    tableName: notesFTSTableName,
    sql: [
      sql`
          CREATE VIRTUAL TABLE ${sql.table(notesFTSTableName)} 
          USING fts5(
            id UNINDEXED, 
            title, 
            body_plain_text, 
            file_id UNINDEXED,
            created_at UNINDEXED,
            updated_at UNINDEXED,
            tokenize="simple",
            content=${sql.table(noteTableName)}
          )`,
      sql`CREATE TRIGGER notes_ai AFTER INSERT ON ${sql.table(noteTableName)}
          BEGIN 
            INSERT INTO ${sql.table(notesFTSTableName)}(rowid, title, body_plain_text) VALUES (new.rowid, new.title, new.body_plain_text);
          END`,

      sql`CREATE TRIGGER notes_ad AFTER DELETE on ${sql.table(noteTableName)}
          BEGIN
            INSERT INTO ${sql.table(notesFTSTableName)}(${sql.raw(notesFTSTableName)}, rowid, title, body_plain_text) VALUES ('delete', old.rowid, old.title, old.body_plain_text);
          END`,

      sql`CREATE TRIGGER notes_au AFTER UPDATE on ${sql.table(noteTableName)}
          BEGIN
            INSERT INTO ${sql.table(notesFTSTableName)}(${sql.raw(notesFTSTableName)}, rowid, title, body_plain_text) VALUES ('delete', old.rowid, old.title, old.body_plain_text);
            INSERT INTO ${sql.table(notesFTSTableName)}(rowid, title, body_plain_text) VALUES (new.rowid, new.title, new.body_plain_text);
          END`,
    ],
  },
  {
    tableName: memosFTSTableName,
    sql: [
      sql`
          CREATE VIRTUAL TABLE ${sql.table(memosFTSTableName)} 
          USING fts5(
            id UNINDEXED, 
            body_plain_text, 
            created_at UNINDEXED,
            updated_at UNINDEXED,
            tokenize="simple",
            content=${sql.table(memoTableName)}
          )`,
      sql`CREATE TRIGGER memos_ai AFTER INSERT ON ${sql.table(memoTableName)}
          BEGIN 
            INSERT INTO ${sql.table(memosFTSTableName)}(rowid, body_plain_text) VALUES (new.rowid, new.body_plain_text);
          END`,

      sql`CREATE TRIGGER memos_ad AFTER DELETE on ${sql.table(memoTableName)}
          BEGIN
            INSERT INTO ${sql.table(memosFTSTableName)}(${sql.table(memosFTSTableName)}, rowid, body_plain_text) VALUES ('delete', old.rowid, old.body_plain_text);
          END`,

      sql`CREATE TRIGGER memos_au AFTER UPDATE on ${sql.table(memoTableName)}
          BEGIN
            INSERT INTO ${sql.table(memosFTSTableName)}(${sql.raw(memosFTSTableName)}, rowid, body_plain_text) VALUES ('delete', old.rowid, new.body_plain_text);
            INSERT INTO ${sql.table(memosFTSTableName)}(rowid, body_plain_text) VALUES (new.rowid, new.body_plain_text);
          END`,
    ],
  },
  {
    tableName: annotationsFTSTableName,
    sql: [
      sql`CREATE VIRTUAL TABLE ${sql.table(annotationsFTSTableName)} 
          USING fts5(
            id UNINDEXED,
            target_id UNINDEXED,
            body_plain_text,
            created_at UNINDEXED,
            updated_at UNINDEXED,
            tokenize="simple",
            content=${sql.table(fileTextTableName)}
        )`,
      sql`CREATE TRIGGER annotations_ai AFTER INSERT ON ${sql.table(annotationTableName)}
          BEGIN 
            INSERT INTO ${sql.table(annotationsFTSTableName)}(rowid, body_plain_text) VALUES (new.rowid, new.body_plain_text);
          END`,

      sql`CREATE TRIGGER annotations_ad AFTER DELETE on ${sql.table(annotationTableName)}
          BEGIN
            INSERT INTO ${sql.table(annotationsFTSTableName)}(${sql.table(annotationsFTSTableName)}, rowid, body_plain_text) VALUES ('delete', old.rowid, old.body_plain_text);
          END`,

      sql`CREATE TRIGGER annotations_au AFTER UPDATE on ${sql.table(annotationTableName)}
          BEGIN
            INSERT INTO ${sql.table(annotationsFTSTableName)}(${sql.raw(annotationsFTSTableName)}, rowid, body_plain_text) VALUES ('delete', old.rowid, new.body_plain_text);
            INSERT INTO ${sql.table(annotationsFTSTableName)}(rowid, body_plain_text) VALUES (new.rowid, new.body_plain_text);
          END`,

        ],
  },
  {
    tableName: fileTextsFTSTableName,
    sql: [
      sql`CREATE VIRTUAL TABLE ${sql.table(fileTextsFTSTableName)} 
          USING fts5(
            file_id UNINDEXED,
            text,
            location UNINDEXED,
            tokenize="simple",
            content=${sql.table(fileTextTableName)}
          )`,


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
    ],
  }
];
