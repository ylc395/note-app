import { Injectable } from '@nestjs/common';
import { type Kysely, sql } from 'kysely';
import groupBy from 'lodash/groupBy';

import { type SearchEngine, type SearchQuery, Types, Scopes, SearchResult } from 'infra/searchEngine';
import { EntityId, EntityLocator, EntityTypes } from 'model/entity';
import SqliteDb from './Database';
import noteTable from './schema/note';

const NOTE_FTS_TABLE = 'notes_fts';

interface SearchEngineDb {
  [NOTE_FTS_TABLE]: { id: string; title: string; body: string; rowid: number; [NOTE_FTS_TABLE]: string };
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

    // prettier-ignore
    await sql`CREATE VIRTUAL TABLE ${sql.table(NOTE_FTS_TABLE)} USING fts5(id UNINDEXED, title, body, content=${sql.table( noteTable.tableName)});`.execute(this.db);

    // prettier-ignore
    await sql`
      CREATE TRIGGER ${sql.raw(NOTE_FTS_TABLE)}_ai AFTER INSERT ON ${sql.table(noteTable.tableName)}
      BEGIN 
        INSERT INTO ${sql.table(NOTE_FTS_TABLE)} (title, body) VALUES (new.title, new.body);
      END;`
    .execute(this.db);

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

  async search(q: SearchQuery) {
    const types = q.types || [Types.Note, Types.Memo, Types.Html, Types.Pdf];
    const searchPromises = types.map((type) => {
      if (type === Types.Note) {
        return this.searchNotes(q);
      }

      throw new Error('unsupported type');
    });

    console.log(await Promise.all(searchPromises));

    return [];
  }

  async remove(entities: EntityLocator[]) {
    const entityGroups = groupBy(entities, 'type');

    await Promise.all(
      Object.entries(entityGroups).map(([type, entities]) => {
        switch (Number(type) as EntityTypes) {
          case EntityTypes.Note:
            return this.removeNotes(entities.map(({ id }) => id));
          default:
            break;
        }
      }),
    );
  }

  private async removeNotes(ids: EntityId[]) {
    const rows = await this.db.selectFrom(NOTE_FTS_TABLE).selectAll().select('rowid').where('id', 'in', ids).execute();
    await this.db
      .insertInto(NOTE_FTS_TABLE)
      .values(rows.map((row) => ({ ...row, [NOTE_FTS_TABLE]: 'delete' })))
      .execute();
  }

  private async searchNotes(q: SearchQuery): Promise<SearchResult[]> {
    if (!this.db) {
      throw new Error('no knex');
    }

    const term = q.terms.join(' ');
    let query = this.db
      .selectFrom(NOTE_FTS_TABLE)
      .select([
        sql<string>`snippet(${sql.raw(NOTE_FTS_TABLE)}, 1, '<b>', '</b>', '...',  10)`.as('title'),
        sql<string>`snippet(${sql.raw(NOTE_FTS_TABLE)}, 2, '<b>', '</b>', '...',  10)`.as('content'),
        'id as entityId',
      ]);

    if (!q.scopes) {
      query = query.where(NOTE_FTS_TABLE, '=', term);
    } else {
      if (q.scopes.includes(Scopes.Body)) {
        query = query.where('body', 'match', term);
      }

      if (q.scopes.includes(Scopes.Title)) {
        query = query.where('title', 'match', term);
      }
    }

    const result = await query.execute();

    return result.map((row) => ({ ...row, type: Types.Note }));
  }
}
