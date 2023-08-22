import { randomUUID } from 'node:crypto';
import type { Insertable, Kysely } from 'kysely';

import type { Db } from '../Database';

export default abstract class BaseRepository {
  constructor(protected readonly db: Kysely<Db>) {}

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
