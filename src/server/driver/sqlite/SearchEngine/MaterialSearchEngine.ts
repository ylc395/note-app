import { sql } from 'kysely';
import compact from 'lodash/compact';

import { type SearchParams, Scopes } from 'model/search';
import { normalizeEntityTitle } from 'model/material';
import { EntityTypes } from 'model/entity';

import materialTable from '../schema/material';
import fileTextTable from '../schema/fileText';
import fileTable from '../schema/file';
import type SearchEngine from './index';
import { FILE_TEXTS_FTS_TABLE, WRAPPER_END_TEXT, WRAPPER_START_TEXT, commonSql } from './tables';

export default class SqliteNoteSearchEngine {
  constructor(private readonly engine: SearchEngine) {}

  async createFtsTable() {
    if (this.engine.sqliteDb.hasTable(FILE_TEXTS_FTS_TABLE)) {
      return;
    }

    await sql`
      CREATE VIRTUAL TABLE ${sql.table(FILE_TEXTS_FTS_TABLE)} 
      USING fts5(
        file_id UNINDEXED,
        text,
        page UNINDEXED,
        location UNINDEXED,
        tokenize="simple 0",
        content=${sql.table(fileTextTable.tableName)}
      );
    `.execute(this.engine.db);

    await sql`
      CREATE TRIGGER ${sql.raw(FILE_TEXTS_FTS_TABLE)}_ai AFTER INSERT ON ${sql.table(fileTextTable.tableName)}
      BEGIN 
        INSERT INTO ${sql.table(FILE_TEXTS_FTS_TABLE)} (rowid, text) VALUES (new.rowid, new.text);
      END;`.execute(this.engine.db);

    // prettier-ignore
    await sql`
      CREATE TRIGGER ${sql.raw(FILE_TEXTS_FTS_TABLE)}_ad AFTER DELETE on ${sql.table(fileTextTable.tableName)}
      BEGIN
        INSERT INTO ${sql.table(FILE_TEXTS_FTS_TABLE)} (${sql.raw(FILE_TEXTS_FTS_TABLE)}, rowid, text) VALUES ('delete', old.rowid, old.text);
      END;`.execute(this.engine.db);

    // prettier-ignore
    await sql`
      CREATE TRIGGER ${sql.raw(FILE_TEXTS_FTS_TABLE)}_au AFTER UPDATE on ${sql.table(fileTextTable.tableName)}
      BEGIN
        INSERT INTO ${sql.table(FILE_TEXTS_FTS_TABLE)} (${sql.raw(FILE_TEXTS_FTS_TABLE)}, rowid, text) VALUES ('delete', old.rowid, new.text);
        INSERT INTO ${sql.table(FILE_TEXTS_FTS_TABLE)} (rowid, text) VALUES (new.rowid, new.text);
      END;`
    .execute(this.engine.db);
  }

  async search(q: SearchParams) {
    if (!this.engine.db) {
      throw new Error('no db');
    }

    // prettier-ignore
    let query = this.engine.db.selectFrom(FILE_TEXTS_FTS_TABLE)
    .innerJoin(materialTable.tableName, `${materialTable.tableName}.fileId`, `${FILE_TEXTS_FTS_TABLE}.fileId`)
    .innerJoin(fileTable.tableName, `${fileTable.tableName}.id`, `${FILE_TEXTS_FTS_TABLE}.fileId`)
    .select([
      sql<string>`simple_snippet(${sql.raw(FILE_TEXTS_FTS_TABLE)}, 1, '${sql.raw(WRAPPER_START_TEXT)}', '${sql.raw(WRAPPER_END_TEXT)}', '...',  100)`.as('body'),
      `${materialTable.tableName}.id as entityId`,
      `${materialTable.tableName}.createdAt`,
      `${fileTable.tableName}.mimeType`,
      `${FILE_TEXTS_FTS_TABLE}.rank`
    ])

    query = commonSql(query, materialTable.tableName, q);

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
