import type { Row as NoteRow } from '../schema/note';
import type { Row as FileTextRow } from '../schema/fileText';
import type { Row as MemoRow } from '../schema/memo';
import type { Row as MaterialRow } from '../schema/material';
import type { Db } from '../Database';

interface FtsRow {
  rowid: number;
  rank: number;
}

export const WRAPPER_START_TEXT = '__%START%__';
export const WRAPPER_END_TEXT = '__%END%__';

export const FILE_TEXTS_FTS_TABLE = 'file_texts_fts';

export type FileTextFtsRow = FtsRow &
  FileTextRow & {
    [FILE_TEXTS_FTS_TABLE]: string;
  };

export const MEMO_FTS_TABLE = 'memos_fts';

export type MemoFtsRow = FtsRow &
  Pick<MemoRow, 'id' | 'content' | 'createdAt' | 'userUpdatedAt'> & {
    [MEMO_FTS_TABLE]: string;
  };

export const NOTE_FTS_TABLE = 'notes_fts';

export type NoteFtsFow = FtsRow &
  Pick<NoteRow, 'id' | 'title' | 'body' | 'createdAt' | 'userUpdatedAt'> & { [NOTE_FTS_TABLE]: string };

export type MaterialFtsFow = FtsRow &
  Pick<MaterialRow, 'id' | 'name' | 'fileId' | 'createdAt' | 'userUpdatedAt'> & { [MATERIAL_FTS_TABLE]: string };

export const MATERIAL_FTS_TABLE = 'materials_fts';

export interface SearchEngineDb extends Db {
  [NOTE_FTS_TABLE]: NoteFtsFow;
  [MEMO_FTS_TABLE]: MemoFtsRow;
  [MATERIAL_FTS_TABLE]: MaterialFtsFow;
  [FILE_TEXTS_FTS_TABLE]: FileTextFtsRow;
}
