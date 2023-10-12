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
export function commonSql(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  qb: SelectQueryBuilder<SearchEngineDb, any, any>,
  table: 'materials' | 'notes_fts' | 'memos_fts',
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
