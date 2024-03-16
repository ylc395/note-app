import { sql } from 'kysely';

import { type SearchParams, Scopes } from '@domain/model/search.js';
import { EntityTypes } from '@domain/model/entity.js';

import type SearchEngine from './index.js';
import {
  MEMO_FTS_TABLE,
  WRAPPER_END_TEXT,
  WRAPPER_START_TEXT,
  type SearchRow,
  FILE_TEXTS_FTS_TABLE,
} from './tables.js';
import { tableName as linkTableName } from '../schema/link.js';
import { tableName as memoTableName } from '../schema/memo.js';
import { commonSql } from './sql.js';

const MEMO_SCOPES = [Scopes.MemoContent, Scopes.MemoFile] as const;

export default class SqliteNoteSearchEngine {
  constructor(private readonly engine: SearchEngine) {}

  async search(q: SearchParams) {
    if (!this.engine.db) {
      throw new Error('no db');
    }

    const scopes = q.scopes || MEMO_SCOPES;
    let result: SearchRow[] = [];

    if (scopes.includes(Scopes.MemoContent)) {
      // prettier-ignore
      let query = this.engine.db.selectFrom(MEMO_FTS_TABLE).select([
          sql<string>`snippet(${sql.raw(MEMO_FTS_TABLE)}, 1, '${sql.raw(WRAPPER_START_TEXT)}', '${sql.raw(WRAPPER_END_TEXT)}', '...',  10)`.as('body'),
          `${MEMO_FTS_TABLE}.createdAt`,
          `${MEMO_FTS_TABLE}.updatedAt`,
          `${MEMO_FTS_TABLE}.id as entityId`,
          sql<string>`'untitled'`.as('title'),
          `${MEMO_FTS_TABLE}.rank`,
        ])
        .where(MEMO_FTS_TABLE, 'match', q.keyword);

      query = commonSql(query, MEMO_FTS_TABLE, q);
      result = await query.execute();
    }

    if (scopes.includes(Scopes.MemoFile)) {
      let query = this.engine.db
        .selectFrom(FILE_TEXTS_FTS_TABLE)
        .innerJoin(linkTableName, `${FILE_TEXTS_FTS_TABLE}.fileId`, `${linkTableName}.targetId`)
        .innerJoin(memoTableName, `${memoTableName}.id`, `${linkTableName}.sourceId`)
        .select([
          // prettier-ignore
          sql<string>`snippet(${sql.raw(FILE_TEXTS_FTS_TABLE)}, 2, '${sql.raw(WRAPPER_START_TEXT)}', '${sql.raw(WRAPPER_END_TEXT)}', '...',  100)`.as('body'),
          sql<string>`'untitled'`.as('title'),
          `${memoTableName}.id as entityId`,
          `${memoTableName}.createdAt`,
          `${memoTableName}.updatedAt`,
          `${FILE_TEXTS_FTS_TABLE}.rank`,
          `${FILE_TEXTS_FTS_TABLE}.page as location`,
        ])
        .where(`${FILE_TEXTS_FTS_TABLE}.text`, 'match', q.keyword);

      query = commonSql(query, memoTableName, q);
      result = result.concat(await query.execute());
    }

    return result.map((row) => ({
      ...row,
      entityType: EntityTypes.Memo as const,
      title: row.body.slice(0, 5),
    }));
  }
}
