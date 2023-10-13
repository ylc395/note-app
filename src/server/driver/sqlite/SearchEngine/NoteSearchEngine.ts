import { sql } from 'kysely';

import { type SearchParams, Scopes } from 'model/search';
import { EntityTypes } from 'model/entity';
import { normalizeTitle } from 'model/note';

import type SearchEngine from './index';
import { NOTE_FTS_TABLE, WRAPPER_END_TEXT, WRAPPER_START_TEXT } from './tables';
import { commonSql } from './sql';

export default class SqliteNoteSearchEngine {
  constructor(private readonly engine: SearchEngine) {}

  async search(q: SearchParams) {
    if (!this.engine.db) {
      throw new Error('no db');
    }

    let query = this.engine.db.selectFrom(NOTE_FTS_TABLE).select([
      // prettier-ignore
      sql<string>`snippet(${sql.raw(NOTE_FTS_TABLE)}, 1, '${sql.raw(WRAPPER_START_TEXT)}', '${sql.raw(WRAPPER_END_TEXT)}', '...',  100)`.as('title'),
      // prettier-ignore
      sql<string>`snippet(${sql.raw(NOTE_FTS_TABLE)}, 2, '${sql.raw(WRAPPER_START_TEXT)}', '${sql.raw(WRAPPER_END_TEXT)}', '...',  100)`.as('body'),
      `${NOTE_FTS_TABLE}.id as entityId`,
      `${NOTE_FTS_TABLE}.createdAt`,
      `${NOTE_FTS_TABLE}.rank`,
    ]);

    query = commonSql(query, NOTE_FTS_TABLE, q);

    query = query.where((eb) => {
      const scopes = q.scopes || [Scopes.Title, Scopes.Body];

      if (scopes.includes(Scopes.Title) && scopes.includes(Scopes.Body)) {
        return eb(NOTE_FTS_TABLE, 'match', q.keyword);
      }

      return scopes.includes(Scopes.Title)
        ? eb(`${NOTE_FTS_TABLE}.body`, 'match', q.keyword)
        : eb(`${NOTE_FTS_TABLE}.title`, 'match', q.keyword);
    });

    const result = await query.execute();

    return result.map((row) => ({
      ...row,
      entityType: EntityTypes.Note as const,
      title: normalizeTitle(row),
    }));
  }
}
