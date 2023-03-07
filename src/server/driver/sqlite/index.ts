import knex, { type Knex } from 'knex';
import camelCase from 'lodash/camelCase';
import snakeCase from 'lodash/snakeCase';
import mapKeys from 'lodash/mapKeys';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type { Database as Sqlite3 } from 'sqlite3';

import type { Database, Transaction } from 'infra/Database';
import type Repository from 'service/repository';

import * as schemas from './schema';
import type { Schema } from './schema/type';
import type { Row as KvRow } from './schema/kvSchema';
import * as repositories from './repository';

const isDevelopment = process.env.NODE_ENV === 'development';

export default class SqliteDb implements Database {
  private knex!: Knex;
  private sqlite3!: Sqlite3;

  async createTransaction() {
    return await this.knex.transaction();
  }

  async getDbId() {
    const KEY = 'db_id';
    const row = await this.knex(schemas.kvSchema.tableName).first<KvRow>().where('key', KEY);

    if (row) {
      return row.value;
    }

    const id = randomUUID();
    await this.knex(schemas.kvSchema.tableName).insert({ key: KEY, value: id });
    return id;
  }

  getRepository<T extends keyof Repository>(name: T) {
    return new repositories[name](this.knex, this.sqlite3) as unknown as Repository[T];
  }

  getRepositoryWithTransaction<T extends keyof Repository>(trx: Transaction, name: T) {
    return new repositories[name](trx as Knex.Transaction, this.sqlite3) as unknown as Repository[T];
  }

  async init(dir: string) {
    this.knex = knex({
      client: 'sqlite3',
      connection: join(dir, 'db.sqlite'),
      debug: isDevelopment,
      postProcessResponse: this.transformKeys,
      useNullAsDefault: true,
      wrapIdentifier: (value, originImpl) => originImpl(snakeCase(value)),
      pool: {
        afterCreate: (sqlite3: Sqlite3, done: () => void) => {
          this.sqlite3 = sqlite3;
          done();
        },
      },
    });

    await this.createTables();
    // await this.emptyTempFiles();
  }

  private transformKeys = (result: unknown): unknown => {
    if (typeof result !== 'object' || result instanceof Date || result === null) {
      return result;
    }

    if (Array.isArray(result)) {
      return result.map(this.transformKeys);
    }

    return mapKeys(result, (_, key) => camelCase(key));
  };

  private async createTables() {
    const _schemas: Schema[] = Object.values(schemas);
    await Promise.all(
      _schemas.map(async ({ tableName, fields, restrictions }) => {
        if (!(await this.knex.schema.hasTable(tableName))) {
          return this.knex.schema.createTable(tableName, (table) => this.builder(table, fields, restrictions));
        }
      }),
    );
  }

  private builder = (
    table: Knex.CreateTableBuilder,
    fields: Schema['fields'],
    restrictions: Schema['restrictions'],
  ) => {
    for (const [fieldName, options] of Object.entries(fields)) {
      let col =
        (options.increments && table.increments(snakeCase(fieldName))) ||
        (options.type && table[options.type](snakeCase(fieldName)));

      if (!col) {
        throw new Error(`no type for column ${fieldName}`);
      }

      if (options.notNullable) {
        col = col.notNullable();
      }

      if (typeof options.defaultTo !== 'undefined') {
        col.defaultTo(typeof options.defaultTo === 'function' ? options.defaultTo(this.knex) : options.defaultTo);
      }
    }

    if (restrictions) {
      if (restrictions.unique) {
        table.unique(restrictions.unique);
      }
    }
  };

  // private async emptyTempFiles() {
  //   await this.knex<FileRow>(fileSchema.tableName).where('isTemp', 1).delete();
  // }
}
