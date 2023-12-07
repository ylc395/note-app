import { randomUUID } from 'node:crypto';
import type { Insertable } from 'kysely';

import type { default as SqliteDatabase, Db } from '../Database.js';

export default abstract class BaseRepository {
  constructor(protected readonly sqliteDb: SqliteDatabase) {}

  protected get db() {
    return this.sqliteDb.getDb();
  }

  protected get kv() {
    return this.sqliteDb.kv;
  }

  protected generateId() {
    return randomUUID().replaceAll('-', '');
  }

  protected createOne<T extends keyof Db>(table: T, row: Insertable<Db[T]>) {
    return this.db.insertInto(table).values(row).returningAll().executeTakeFirstOrThrow();
  }

  protected _batchCreate<T extends keyof Db>(table: T, rows: Insertable<Db[T]>[]) {
    return this.db.insertInto(table).values(rows).returningAll().execute();
  }
}
