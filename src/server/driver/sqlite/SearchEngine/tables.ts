import type { SelectQueryBuilder } from 'kysely';
import dayjs from 'dayjs';

import type { SearchParams } from 'model/search';
import type { Row as NoteRow } from '../schema/note';
import type { Row as FileTextRow } from '../schema/fileText';
import type { Row as MemoRow } from '../schema/memo';
import { tableName as recyclableTableName } from '../schema/recyclable';
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

export interface SearchEngineDb extends Db {
  [NOTE_FTS_TABLE]: NoteFtsFow;
  [MEMO_FTS_TABLE]: MemoFtsRow;
  [FILE_TEXTS_FTS_TABLE]: FileTextFtsRow;
}
