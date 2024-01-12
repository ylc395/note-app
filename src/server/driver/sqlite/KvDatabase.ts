import type { Kysely } from 'kysely';
import type { KvDatabase } from '@domain/infra/kvDatabase.js';

import type SqliteDb from './Database.js';

type Row = { key: string; value: string };

const tableName = 'kv';

export interface KvDb {
  [tableName]: Row;
}

export default class SqliteKvDatabase implements KvDatabase {
  constructor(private readonly sqliteDb: SqliteDb) {
    this.ready = this.init();
  }

  public readonly ready: Promise<void>;

  private get db() {
    return this.sqliteDb.getDb() as unknown as Kysely<KvDb>;
  }

  async init() {
    await this.sqliteDb.ready;
    await this.db.schema
      .createTable(tableName)
      .ifNotExists()
      .addColumn('key', 'text', (col) => col.notNull().primaryKey())
      .addColumn('value', 'text', (col) => col.notNull())
      .execute();
  }

  async set(key: string, value: string) {
    const { numUpdatedRows } = await this.db
      .updateTable(tableName)
      .set({ value })
      .where('key', '=', key)
      .executeTakeFirst();

    if (numUpdatedRows === 0n) {
      await this.db.insertInto(tableName).values({ key, value }).execute();
    }
  }

  async get(key: string): Promise<string | null>;
  async get(key: string, value: () => string): Promise<string>;
  async get(key: string, value?: () => string) {
    const row = await this.db.selectFrom(tableName).selectAll().where('key', '=', key).executeTakeFirst();

    if (row) {
      return row.value;
    } else if (!value) {
      return null;
    }

    const v = value();
    await this.db.insertInto(tableName).values({ value: v, key }).execute();
    return v;
  }
}
