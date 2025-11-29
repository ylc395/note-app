import { sql } from 'kysely';

import { type Row as FileTextRow, tableName as fileTextTableName } from '../schema/fileText.js';
import { tableName as noteTableName, type Row as NoteRow } from '../schema/note.js';
import type { Schemas } from '../schema/index.js';

export const WRAPPER_START_TEXT = '__%START%__';
export const WRAPPER_END_TEXT = '__%END%__';

export const notesFTSTableName = 'notes_fts';
export const fileTextsFTSTableName = 'file_texts_fts';

interface FtsRow {
  rank: number;
}

// prettier-ignore
export interface SearchEngineDb extends Schemas {
  [fileTextsFTSTableName]: FtsRow & FileTextRow & { [fileTextsFTSTableName]: string };
  [notesFTSTableName]: FtsRow & Pick<NoteRow, 'id' | 'title' | 'body' | 'fileId' | 'type' | 'details' | 'parentId'> & { [notesFTSTableName]: string };
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
            type UNINDEXED,
            details UNINDEXED,
            parentId UNINDEXED,
            created_at UNINDEXED,
            updated_at UNINDEXED,
            tokenize="simple 0",
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
    tableName: fileTextsFTSTableName,
    sql: [
      sql`CREATE VIRTUAL TABLE ${sql.table(fileTextsFTSTableName)} 
          USING fts5(
            file_id UNINDEXED,
            text,
            location UNINDEXED,
            tokenize="simple 0",
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
