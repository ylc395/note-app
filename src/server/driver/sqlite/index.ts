import knex, { type Knex } from 'knex';
import camelCase from 'lodash/camelCase';
import snakeCase from 'lodash/snakeCase';
import mapKeys from 'lodash/mapKeys';
import { join } from 'path';

import noteSchema from './schema/noteSchema';
import type { Fields } from './schema/type';

const isDevelopment = process.env.NODE_ENV === 'development';

class SqliteDb {
  knex!: Knex;
  async init(dir: string) {
    this.knex = knex({
      client: 'sqlite3',
      connection: join(dir, 'db.sqlite'),
      debug: isDevelopment,
      postProcessResponse: this.transformKeys,
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
    const schemas = [noteSchema];

    await Promise.all(
      schemas.map(async ({ tableName, fields }) => {
        if (!(await this.knex.schema.hasTable(tableName))) {
          return this.knex.schema.createTable(tableName, (table) => this.builder(table, fields));
        }
      }),
    );
  }

  private builder = (table: Knex.CreateTableBuilder, fields: Fields) => {
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
  };

  // private async emptyTempFiles() {
  //   await this.knex<FileRow>(fileSchema.tableName).where('isTemp', 1).delete();
  // }
}

export default new SqliteDb();
