import type { Row as NoteRow } from '../schema/note';
import type { Row as FileTextRow } from '../schema/fileText';
import type { Row as MemoRow } from '../schema/memo';
import type { Row as MaterialRow } from '../schema/material';
import type { Row as MaterialAnnotationRow } from '../schema/materialAnnotation';
import type { Db } from '../Database';

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
export const MATERIAL_ANNOTATION_FTS_TABLE = 'material_annotations_fts';

type FileTextFtsRow = FtsRow &
  FileTextRow & {
    [FILE_TEXTS_FTS_TABLE]: string;
  };

type MemoFtsRow = FtsRow &
  Pick<MemoRow, 'id' | 'content' | 'createdAt' | 'userUpdatedAt'> & {
    [MEMO_FTS_TABLE]: string;
  };

type NoteFtsFow = FtsRow &
  Pick<NoteRow, 'id' | 'title' | 'body' | 'createdAt' | 'userUpdatedAt'> & { [NOTE_FTS_TABLE]: string };

type MaterialFtsFow = FtsRow &
  Pick<MaterialRow, 'id' | 'title' | 'fileId' | 'createdAt' | 'userUpdatedAt' | 'comment'> & {
    [MATERIAL_FTS_TABLE]: string;
  };

type MaterialAnnotationFtsRow = FtsRow &
  Pick<MaterialAnnotationRow, 'id' | 'comment' | 'createdAt' | 'materialId' | 'updatedAt' | 'meta'> & {
    [MATERIAL_ANNOTATION_FTS_TABLE]: string;
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
  [MATERIAL_ANNOTATION_FTS_TABLE]: MaterialAnnotationFtsRow;
}
