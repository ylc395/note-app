import { sql } from 'kysely';

import { type SearchParams, Scopes } from 'model/search';
import { EntityTypes } from 'model/entity';
import { normalizeTitle } from 'model/note';

import type SearchEngine from './index';
import { FILE_TEXTS_FTS_TABLE, NOTE_FTS_TABLE, WRAPPER_END_TEXT, WRAPPER_START_TEXT, type SearchRow } from './tables';
import { commonSql } from './sql';
import { tableName as linkTableName } from '../schema/link';
import { tableName as noteTableName } from '../schema/note';

const NOTE_SCOPES = [Scopes.NoteBody, Scopes.NoteTitle, Scopes.NoteFile] as const;

export default class SqliteNoteSearchEngine {
  constructor(private readonly engine: SearchEngine) {}

  async search(q: SearchParams) {
    if (!this.engine.db) {
      throw new Error('no db');
    }
    const scopes = q.scopes || NOTE_SCOPES;
    let result: SearchRow[] = [];

    if (scopes.includes(Scopes.NoteTitle) || scopes.includes(Scopes.NoteBody)) {
      let query = this.engine.db.selectFrom(NOTE_FTS_TABLE).select([
        // prettier-ignore
        sql<string>`snippet(${sql.raw(NOTE_FTS_TABLE)}, 1, '${sql.raw(WRAPPER_START_TEXT)}', '${sql.raw(WRAPPER_END_TEXT)}', '...',  100)`.as('title'),
        // prettier-ignore
        sql<string>`snippet(${sql.raw(NOTE_FTS_TABLE)}, 2, '${sql.raw(WRAPPER_START_TEXT)}', '${sql.raw(WRAPPER_END_TEXT)}', '...',  100)`.as('body'),
        `${NOTE_FTS_TABLE}.id as entityId`,
        `${NOTE_FTS_TABLE}.createdAt`,
        `${NOTE_FTS_TABLE}.userUpdatedAt as updatedAt`,
        `${NOTE_FTS_TABLE}.rank`,
      ]);

      query = commonSql(query, NOTE_FTS_TABLE, q);

      query = query.where((eb) => {
        if (scopes.includes(Scopes.NoteTitle) && scopes.includes(Scopes.NoteBody)) {
          return eb(NOTE_FTS_TABLE, 'match', q.keyword);
        }

        return scopes.includes(Scopes.NoteTitle)
          ? eb(`${NOTE_FTS_TABLE}.title`, 'match', q.keyword)
          : eb(`${NOTE_FTS_TABLE}.body`, 'match', q.keyword);
      });

      result = await query.execute();
    }

    if (scopes.includes(Scopes.NoteFile)) {
      let query = this.engine.db
        .selectFrom(FILE_TEXTS_FTS_TABLE)
        .innerJoin(linkTableName, `${FILE_TEXTS_FTS_TABLE}.fileId`, `${linkTableName}.toEntityId`)
        .innerJoin(noteTableName, `${noteTableName}.id`, `${linkTableName}.fromEntityId`)
        .select([
          // prettier-ignore
          sql<string>`snippet(${sql.raw(FILE_TEXTS_FTS_TABLE)}, 2, '${sql.raw(WRAPPER_START_TEXT)}', '${sql.raw(WRAPPER_END_TEXT)}', '...',  100)`.as('body'),
          `${noteTableName}.title`,
          `${noteTableName}.id as entityId`,
          `${noteTableName}.createdAt`,
          `${noteTableName}.userUpdatedAt as updatedAt`,
          `${FILE_TEXTS_FTS_TABLE}.rank`,
          `${FILE_TEXTS_FTS_TABLE}.page as location`,
        ])
        .where(`${FILE_TEXTS_FTS_TABLE}.text`, 'match', q.keyword);

      query = commonSql(query, noteTableName, q);
      result = result.concat(await query.execute());
    }

    return result.map((row) => ({
      ...row,
      entityType: EntityTypes.Note as const,
      title: normalizeTitle(row),
    }));
  }
}
