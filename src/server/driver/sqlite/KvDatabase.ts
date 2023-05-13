import type { Knex } from 'knex';
import once from 'lodash/once';

import type SqliteDb from './index';

type Row = {
  key: string;
  value: string;
};

const tableName = 'kv';

export default class SqliteKvDatabase {
  private knex?: Knex;

  constructor(private readonly sqliteDb: SqliteDb) {
    this.init();
  }

  readonly init = once(async () => {
    this.knex = await this.sqliteDb.getKnex();
    await this.createTable();
  });

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
      throw new Error('kv db not ready');
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
