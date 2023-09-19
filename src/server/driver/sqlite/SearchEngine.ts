import { Injectable } from '@nestjs/common';
import { type Kysely, sql } from 'kysely';

import type { SearchEngine } from 'infra/searchEngine';
import { EntityTypes } from 'model/entity';
import { type SearchParams, type SearchResult, Scopes } from 'model/search';
import SqliteDb, { type Db } from './Database';
import noteTable, { Row as NoteRow } from './schema/note';
import recyclableTable from './schema/recyclable';
import dayjs from 'dayjs';

const NOTE_FTS_TABLE = 'notes_fts';
const WRAPPER_START_TEXT = '__%START%__';
const WRAPPER_END_TEXT = '__%END%__';

interface SearchEngineDb extends Db {
  [NOTE_FTS_TABLE]: NoteRow & { rowid: number; [NOTE_FTS_TABLE]: string; rank: number };
}

@Injectable()
export default class SqliteSearchEngine implements SearchEngine {
  readonly ready: Promise<void>;

  constructor(private sqliteDb: SqliteDb) {
    this.ready = this.init();
  }

  private get db() {
    return this.sqliteDb.getDb() as unknown as Kysely<SearchEngineDb>;
  }

  private async init() {
    await this.sqliteDb.ready;
    await Promise.all([this.createNoteFtsTable()]);
  }

  private async createNoteFtsTable() {
    if (this.sqliteDb.hasTable(NOTE_FTS_TABLE)) {
      return;
    }

    await sql`
      CREATE VIRTUAL TABLE ${sql.table(NOTE_FTS_TABLE)} 
      USING fts5(id UNINDEXED, title, body, content=${sql.table(noteTable.tableName)});
    `.execute(this.db);

    await sql`
      CREATE TRIGGER ${sql.raw(NOTE_FTS_TABLE)}_ai AFTER INSERT ON ${sql.table(noteTable.tableName)}
      BEGIN 
        INSERT INTO ${sql.table(NOTE_FTS_TABLE)} (title, body) VALUES (new.title, new.body);
      END;`.execute(this.db);

    // prettier-ignore
    await sql`
      CREATE TRIGGER ${sql.raw(NOTE_FTS_TABLE)}_ad AFTER DELETE on ${sql.table(noteTable.tableName)}
      BEGIN
        INSERT INTO ${sql.table(NOTE_FTS_TABLE)} (${sql.raw(NOTE_FTS_TABLE)}, rowid, title, body) VALUES ('delete', old.rowid, old.title, old.body);
      END;`
    .execute(this.db);

    // prettier-ignore
    await sql`
      CREATE TRIGGER ${sql.raw(NOTE_FTS_TABLE)}_au AFTER UPDATE on ${sql.table(noteTable.tableName)}
      BEGIN
        INSERT INTO ${sql.table(NOTE_FTS_TABLE)} (${sql.raw(NOTE_FTS_TABLE)}, rowid, title, body) VALUES ('delete', old.rowid, old.title, old.body);
        INSERT INTO ${sql.table(NOTE_FTS_TABLE)} (rowid, title, body) VALUES (new.rowid, new.title, new.body);
      END;`
    .execute(this.db);
  }

  async search(q: SearchParams) {
    const types = q.types || [EntityTypes.Note, EntityTypes.Memo, EntityTypes.Material, EntityTypes.MaterialAnnotation];

    const searchResult = (
      await Promise.all([
        types.includes(EntityTypes.Note) ? this.searchNotes(q) : [],
        // types.includes(EntityTypes.Material) ? this.searchMaterials(q) : [],
        // types.includes(EntityTypes.MaterialAnnotation) ? this.searchMaterialAnnotations(q) : [],
        // types.includes(EntityTypes.Memo) ? this.searchMemos(q) : [],
      ])
    ).flat();

    return searchResult.map((result) => {
      const { text: title, highlights: titleHighlights } = SqliteSearchEngine.extractSnippet(
        result.title,
        Scopes.Title,
      );
      const { text: body, highlights: bodyHighlights } = SqliteSearchEngine.extractSnippet(result.body, Scopes.Body);

      return { ...result, title, body, highlights: [...titleHighlights, ...bodyHighlights] };
    });
  }

  private static extractSnippet(snippet: string, type: Scopes) {
    const highlights: SearchResult['highlights'] = [];

    let i = 0;
    let index = -1;

    while ((index = snippet.indexOf(WRAPPER_START_TEXT, index + 1)) > -1) {
      const endIndex = snippet.indexOf(WRAPPER_END_TEXT, index + 1);

      highlights.push({
        start: index - (WRAPPER_START_TEXT.length + WRAPPER_END_TEXT.length) * i,
        end: endIndex - (WRAPPER_START_TEXT.length * (i + 1) + WRAPPER_END_TEXT.length * i) - 1,
        scope: type,
      });

      i += 1;
    }

    return {
      text: snippet.replaceAll(WRAPPER_START_TEXT, '').replaceAll(WRAPPER_END_TEXT, ''),
      highlights,
    };
  }

  private async searchNotes(q: SearchParams) {
    if (!this.db) {
      throw new Error('no db');
    }

    const term = q.terms.join(' ');

    let query = this.db.selectFrom(NOTE_FTS_TABLE).select([
      // prettier-ignore
      sql<string>`snippet(${sql.raw(NOTE_FTS_TABLE)}, 1, '${sql.raw(WRAPPER_START_TEXT)}', '${sql.raw(WRAPPER_END_TEXT)}', '...',  10)`.as('title'),
      // prettier-ignore
      sql<string>`snippet(${sql.raw(NOTE_FTS_TABLE)}, 2, '${sql.raw(WRAPPER_START_TEXT)}', '${sql.raw(WRAPPER_END_TEXT)}', '...',  10)`.as('body'),
      'id as entityId',
    ]);

    if (!q.recyclables) {
      query = query
        .leftJoin(recyclableTable.tableName, `${recyclableTable.tableName}.entityId`, `${NOTE_FTS_TABLE}.id`)
        .where(`${recyclableTable.tableName}.entityId`, 'is', null);
    }

    if (!q.scopes) {
      query = query.where(NOTE_FTS_TABLE, '=', term);
    } else {
      if (q.scopes.includes(Scopes.Body)) {
        query = query.where(`${NOTE_FTS_TABLE}.body`, 'match', term);
      }

      if (q.scopes.includes(Scopes.Title)) {
        query = query.where(`${NOTE_FTS_TABLE}.title`, 'match', term);
      }
    }

    if (q.created) {
      if (q.created.from) {
        query = query.where(`${NOTE_FTS_TABLE}.createdAt`, '>=', dayjs(q.created.from).valueOf());
      }
      if (q.created.to) {
        query = query.where(`${NOTE_FTS_TABLE}.createdAt`, '<=', dayjs(q.created.to).valueOf());
      }
    }

    if (q.updated) {
      if (q.updated.from) {
        query = query.where(`${NOTE_FTS_TABLE}.userUpdatedAt`, '>=', dayjs(q.updated.from).valueOf());
      }
      if (q.updated.to) {
        query = query.where(`${NOTE_FTS_TABLE}.userUpdatedAt`, '<=', dayjs(q.updated.to).valueOf());
      }
    }

    const result = await query.orderBy(`${NOTE_FTS_TABLE}.rank`).execute();

    return result.map((row) => ({ ...row, entityType: EntityTypes.Note }));
  }
}
