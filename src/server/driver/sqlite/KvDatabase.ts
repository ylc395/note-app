import type { Kysely } from 'kysely';
import { Injectable } from '@nestjs/common';

import type { KvDatabase } from 'infra/kvDatabase';
import SqliteDb from './Database';

type Row = {
  key: string;
  value: string;
};

const tableName = 'kv';

export interface KvDb {
  [tableName]: Row;
}

@Injectable()
export default class SqliteKvDatabase implements KvDatabase {
  private db?: Kysely<KvDb>;
  readonly ready: Promise<void>;
  constructor(private readonly sqliteDb: SqliteDb) {
    this.ready = this.init();
  }

  private async init() {
    this.db = (await this.sqliteDb.getDb()) as unknown as Kysely<KvDb>;
    await this.createTable();
  }

  private async createTable() {
    if (!this.db) {
      throw new Error('kv db not ready');
    }

    if (!this.sqliteDb.hasTable(tableName)) {
      await this.db.schema
        .createTable(tableName)
        .addColumn('key', 'text', (col) => col.notNull().primaryKey())
        .addColumn('value', 'text', (col) => col.notNull())
        .execute();
    }
  }

  async set(key: string, value: string) {
    if (!this.db) {
      throw new Error('kv db not ready');
    }

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
    if (!this.db) {
      throw new Error('no knex');
    }

    const row = await this.db.selectFrom(tableName).selectAll().where('key', '=', key).executeTakeFirst();

    if (row) {
      return row.value;
    } else if (!value) {
      return null;
    }

    const v = value();
    await this.db.insertInto(tableName).values({ value: v, key });
    return v;
  }
}
