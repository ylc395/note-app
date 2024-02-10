import type { Row as NoteRow } from '../schema/note.js';
import type { Row as FileTextRow } from '../schema/fileText.js';
import type { Row as MemoRow } from '../schema/memo.js';
import type { Row as MaterialRow } from '../schema/material.js';
import type { Row as AnnotationRow } from '../schema/annotation.js';
import type { Db } from '../Database.js';

interface FtsRow {
  rowid: number;
  rank: number;
}

export const WRAPPER_START_TEXT = '__%START%__';
export const WRAPPER_END_TEXT = '__%END%__';

export const FILE_TEXTS_FTS_TABLE = 'file_texts_fts';
export const MEMO_FTS_TABLE = 'memos_fts';
export const NOTE_FTS_TABLE = 'notes_fts';
export const MATERIAL_FTS_TABLE = 'materials_fts';
export const ANNOTATION_FTS_TABLE = 'annotations_fts';

type FileTextFtsRow = FtsRow &
  FileTextRow & {
    [FILE_TEXTS_FTS_TABLE]: string;
  };

type MemoFtsRow = FtsRow &
  Pick<MemoRow, 'id' | 'body' | 'createdAt' | 'updatedAt'> & {
    [MEMO_FTS_TABLE]: string;
  };

type NoteFtsFow = FtsRow &
  Pick<NoteRow, 'id' | 'title' | 'body' | 'createdAt' | 'updatedAt'> & { [NOTE_FTS_TABLE]: string };

type MaterialFtsFow = FtsRow &
  Pick<MaterialRow, 'id' | 'title' | 'fileId' | 'createdAt' | 'updatedAt' | 'comment'> & {
    [MATERIAL_FTS_TABLE]: string;
  };

type MaterialAnnotationFtsRow = FtsRow &
  Pick<AnnotationRow, 'id' | 'body' | 'createdAt' | 'targetId' | 'updatedAt'> & {
    [ANNOTATION_FTS_TABLE]: string;
  };

export interface SearchRow {
  entityId: string;
  title: string;
  body: string;
  rank: number;
  location?: number | null;
  annotationId?: string;
  mimeType?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SearchEngineDb extends Db {
  [NOTE_FTS_TABLE]: NoteFtsFow;
  [MEMO_FTS_TABLE]: MemoFtsRow;
  [MATERIAL_FTS_TABLE]: MaterialFtsFow;
  [FILE_TEXTS_FTS_TABLE]: FileTextFtsRow;
  [ANNOTATION_FTS_TABLE]: MaterialAnnotationFtsRow;
}
