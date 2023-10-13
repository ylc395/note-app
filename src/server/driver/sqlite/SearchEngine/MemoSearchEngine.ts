import { sql } from 'kysely';

import { type SearchParams, Scopes } from 'model/search';
import { normalizeTitle } from 'model/memo';
import { EntityTypes } from 'model/entity';

import type SearchEngine from './index';
import { MEMO_FTS_TABLE, WRAPPER_END_TEXT, WRAPPER_START_TEXT } from './tables';
import { commonSql } from './sql';

export default class SqliteNoteSearchEngine {
  constructor(private readonly engine: SearchEngine) {}

  async search(q: SearchParams) {
    if (!this.engine.db) {
      throw new Error('no db');
    }

    // prettier-ignore
    let query = this.engine.db.selectFrom(MEMO_FTS_TABLE).select([
      sql<string>`snippet(${sql.raw(MEMO_FTS_TABLE)}, 1, '${sql.raw(WRAPPER_START_TEXT)}', '${sql.raw(WRAPPER_END_TEXT)}', '...',  10)`.as('body'),
      `${MEMO_FTS_TABLE}.createdAt`,
      `${MEMO_FTS_TABLE}.id as entityId`,
      `${MEMO_FTS_TABLE}.rank`,
    ]);

    query = commonSql(query, MEMO_FTS_TABLE, q);

    if (!q.scopes) {
      query = query.where(MEMO_FTS_TABLE, '=', q.keyword);
    } else {
      if (q.scopes.includes(Scopes.Body)) {
        query = query.where(`${MEMO_FTS_TABLE}.content`, 'match', q.keyword);
      }
    }

    const result = await query.execute();

    return result.map((row) => ({
      ...row,
      entityType: EntityTypes.Memo as const,
      title: normalizeTitle(row),
    }));
  }
}
