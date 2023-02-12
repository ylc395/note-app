import knex, { type Knex } from 'knex';
import camelCase from 'lodash/camelCase';
import snakeCase from 'lodash/snakeCase';
import mapKeys from 'lodash/mapKeys';
import { join } from 'path';

import type { Database, Transaction } from 'infra/Database';
import type Repository from 'service/repository';

import type { Schema } from './schema/type';

import * as schemas from './schema';
import * as repositories from './repository';

const isDevelopment = process.env.NODE_ENV === 'development';

export default class SqliteDb implements Database {
  private knex!: Knex;

  async createTransaction() {
    return await this.knex.transaction();
  }

  getRepository<T extends keyof Repository>(name: T) {
    return new repositories[name](this.knex) as unknown as Repository[T];
  }

  getRepositoryWithTransaction<T extends keyof Repository>(trx: Transaction, name: T) {
    return new repositories[name](trx as Knex.Transaction) as unknown as Repository[T];
  }

  async init(dir: string) {
    this.knex = knex({
      client: 'sqlite3',
      connection: join(dir, 'db.sqlite'),
      debug: isDevelopment,
      postProcessResponse: this.transformKeys,
      useNullAsDefault: true,
      wrapIdentifier: (value, originImpl) => originImpl(snakeCase(value)),
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
