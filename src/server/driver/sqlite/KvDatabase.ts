import type { Knex } from 'knex';
import { Injectable } from '@nestjs/common';

import type { KvDatabase } from 'infra/kvDatabase';
import SqliteDb from './Database';

type Row = {
  key: string;
  value: string;
};

const tableName = 'kv';

@Injectable()
export default class SqliteKvDatabase implements KvDatabase {
  private knex?: Knex;
  readonly ready: Promise<void>;
  constructor(private readonly sqliteDb: SqliteDb) {
    this.ready = this.init();
  }

  private async init() {
    this.knex = await this.sqliteDb.getKnex();
    await this.createTable();
  }

  private async createTable() {
    if (!this.knex) {
      throw new Error('kv db not ready');
    }

    if (!(await this.knex.schema.hasTable(tableName))) {
      await this.knex.schema.createTable(tableName, (t) => {
        t.text('key').notNullable().primary();
        t.text('value').notNullable();
      });
    }
  }

  async set(key: string, value: string) {
    if (!this.knex) {
      throw new Error('kv db not ready');
    }

    const count = await this.knex<Row>(tableName).update({ value }).where('key', key);

    if (count === 0) {
      await this.knex<Row>(tableName).insert({ key, value });
    }
  }

  async get(key: string): Promise<string | null>;
  async get(key: string, value: () => string): Promise<string>;
  async get(key: string, value?: () => string) {
    if (!this.knex) {
      throw new Error('no knex');
    }

    const row = await this.knex<Row>(tableName).where('key', key).first();

    if (row) {
      return row.value;
    } else if (!value) {
      return null;
    }

    const v = value();
    await this.knex<Row>(tableName).insert({ value: v, key });
    return v;
  }
}
