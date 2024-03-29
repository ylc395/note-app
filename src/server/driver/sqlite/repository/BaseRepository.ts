import { randomUUID } from 'node:crypto';
import type { Insertable, Selectable } from 'kysely';

import type { default as SqliteDatabase, Db } from '../Database.js';

export default abstract class BaseRepository {
  constructor(protected readonly sqliteDb: SqliteDatabase) {}

  protected get db() {
    return this.sqliteDb.getDb();
  }

  protected generateId() {
    return randomUUID().replaceAll('-', '');
  }

  protected createOneOn<T extends keyof Db>(table: T, row: Insertable<Db[T]>): Promise<Selectable<Db[T]>> {
    return this.db.insertInto(table).values(row).returningAll().executeTakeFirstOrThrow();
  }

  protected batchCreateOn<T extends keyof Db>(table: T, rows: Insertable<Db[T]>[]): Promise<Selectable<Db[T]>[]> {
    if (rows.length === 0) {
      return Promise.resolve([]);
    }

    return this.db.insertInto(table).values(rows).returningAll().execute();
  }
}
