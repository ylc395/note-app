import { sql } from 'kysely';

import { type SearchParams, Scopes } from 'model/search';
import { normalizeTitle } from 'model/memo';
import { EntityTypes } from 'model/entity';

import type SearchEngine from './index';
import { MEMO_FTS_TABLE, WRAPPER_END_TEXT, WRAPPER_START_TEXT, type SearchRow, FILE_TEXTS_FTS_TABLE } from './tables';
import { tableName as linkTableName } from '../schema/link';
import { tableName as memoTableName } from '../schema/memo';
import { commonSql } from './sql';

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
          `${MEMO_FTS_TABLE}.userUpdatedAt as updatedAt`,
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
        .innerJoin(linkTableName, `${FILE_TEXTS_FTS_TABLE}.fileId`, `${linkTableName}.toEntityId`)
        .innerJoin(memoTableName, `${memoTableName}.id`, `${linkTableName}.fromEntityId`)
        .select([
          // prettier-ignore
          sql<string>`snippet(${sql.raw(FILE_TEXTS_FTS_TABLE)}, 2, '${sql.raw(WRAPPER_START_TEXT)}', '${sql.raw(WRAPPER_END_TEXT)}', '...',  100)`.as('body'),
          sql<string>`'untitled'`.as('title'),
          `${memoTableName}.id as entityId`,
          `${memoTableName}.createdAt`,
          `${memoTableName}.userUpdatedAt as updatedAt`,
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
      title: normalizeTitle(row),
    }));
  }
}
