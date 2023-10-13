import { sql } from 'kysely';
import compact from 'lodash/compact';

import { type SearchParams, Scopes } from 'model/search';
import { normalizeEntityTitle } from 'model/material';
import { EntityTypes } from 'model/entity';

import type SearchEngine from './index';
import { FILE_TEXTS_FTS_TABLE, MATERIAL_FTS_TABLE, WRAPPER_END_TEXT, WRAPPER_START_TEXT } from './tables';
import { commonSql } from './sql';
import fileTable from '../schema/file';

export default class SqliteNoteSearchEngine {
  constructor(private readonly engine: SearchEngine) {}

  async search(q: SearchParams) {
    if (!this.engine.db) {
      throw new Error('no db');
    }

    // prettier-ignore
    let query = this.engine.db.selectFrom(FILE_TEXTS_FTS_TABLE)
    .innerJoin(MATERIAL_FTS_TABLE, `${MATERIAL_FTS_TABLE}.fileId`, `${FILE_TEXTS_FTS_TABLE}.fileId`)
    .innerJoin(fileTable.tableName, `${fileTable.tableName}.id`, `${FILE_TEXTS_FTS_TABLE}.fileId`)
    .select([
      sql<string>`simple_snippet(${sql.raw(FILE_TEXTS_FTS_TABLE)}, 1, '${sql.raw(WRAPPER_START_TEXT)}', '${sql.raw(WRAPPER_END_TEXT)}', '...',  100)`.as('body'),
      `${MATERIAL_FTS_TABLE}.id as entityId`,
      `${MATERIAL_FTS_TABLE}.createdAt`,
      `${fileTable.tableName}.mimeType`,
      `${FILE_TEXTS_FTS_TABLE}.rank`
    ])

    query = commonSql(query, MATERIAL_FTS_TABLE, q);

    query = query
      .where((eb) => {
        const scopes = q.scopes || [Scopes.Title, Scopes.Body];

        return eb.or(
          compact([
            scopes.includes(Scopes.Body) && eb(`${FILE_TEXTS_FTS_TABLE}.text`, 'match', q.keyword),
            // see https://sqlite.org/forum/forumpost/f9bb0db67d?t=h&hist
            // scopes.includes(Scopes.Title) && eb(`${materialTable.tableName}.name`, 'like', `%${term}%`),
          ]),
        );
      })
      .orderBy(`${FILE_TEXTS_FTS_TABLE}.rank`, 'desc');

    const result = await query.execute();

    return result.map((row) => ({
      ...row,
      entityType: EntityTypes.Material as const,
      title: normalizeEntityTitle(row),
    }));
  }
}
