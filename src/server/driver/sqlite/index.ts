import knex, { type Knex } from 'knex';
import camelCase from 'lodash/camelCase';
import snakeCase from 'lodash/snakeCase';
import mapKeys from 'lodash/mapKeys';
import { join } from 'path';
import { container } from 'tsyringe';
import { token as transactionManagerToken } from 'infra/TransactionManager';
import transactionManager from './transactionManager';

import type { Schema } from './schema/type';
import noteSchema from './schema/noteSchema';
import recyclableSchema from './schema/recyclableSchema';

const isDevelopment = process.env.NODE_ENV === 'development';

class SqliteDb {
  knex!: Knex;
  transactionManager!: ReturnType<typeof transactionManager>;
  async init(dir: string) {
    this.knex = knex({
      client: 'sqlite3',
      connection: join(dir, 'db.sqlite'),
      debug: isDevelopment,
      postProcessResponse: this.transformKeys,
      useNullAsDefault: true,
      wrapIdentifier: (value, originImpl) => originImpl(snakeCase(value)),
    });
    this.transactionManager = transactionManager(this.knex);

    container.registerInstance(transactionManagerToken, this.transactionManager);
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
    const schemas: Schema[] = [noteSchema, recyclableSchema];

    await Promise.all(
      schemas.map(async ({ tableName, fields, restrictions }) => {
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

export default new SqliteDb();
