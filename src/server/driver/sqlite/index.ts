import type { Knex } from 'knex';
import snakeCase from 'lodash/snakeCase';

import type { Database, Transaction } from 'infra/Database';
import type Repository from 'service/repository';

import * as schemas from './schema';
import * as repositories from './repository';
import type { Schema } from './schema/type';
import { createDb } from 'shared/driver/sqlite';

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
    this.knex = createDb(dir);
    await this.createTables();
  }

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
      let col = table[options.type](snakeCase(fieldName));

      if (options.notNullable) {
        col = col.notNullable();
      }

      if (options.unique) {
        col = col.unique();
      }

      if (options.primary) {
        col.primary();
      }

      if (typeof options.defaultTo !== 'undefined') {
        col.defaultTo(typeof options.defaultTo === 'function' ? options.defaultTo(this.knex) : options.defaultTo);
      }
    }

    if (restrictions) {
      if (restrictions.unique) {
        table.unique(restrictions.unique);
      }

      if (restrictions.foreign) {
        for (const [col, foreignCol] of Object.entries(restrictions.foreign)) {
          table.foreign(col).references(foreignCol);
        }
      }
    }
  };

  // private async emptyTempFiles() {
  //   await this.knex<FileRow>(fileSchema.tableName).where('isTemp', 1).delete();
  // }
}
