import knex, { type Knex } from 'knex';
import camelCase from 'lodash/camelCase';
import snakeCase from 'lodash/snakeCase';
import mapKeys from 'lodash/mapKeys';
import partialRight from 'lodash/partialRight';
import { join } from 'path';

import materialsSchema from './materialSchema';
import fileSchema from './fileSchema';

const isDevelopment = process.env.NODE_ENV === 'development';

class SqliteDb {
  knex: Knex;
  readonly init = async (dir: string) => {
    this.knex = knex({
      client: 'sqlite3',
      connection: join(dir, 'db.sqlite'),
      debug: isDevelopment,
      asyncStackTraces: isDevelopment,
      postProcessResponse: this.#transformKeys,
      wrapIdentifier: (value, originImpl) => originImpl(snakeCase(value)),
    });
    await this.#createTables();
  };

  #transformKeys = (result: unknown): unknown => {
    if (typeof result !== 'object' || result instanceof Date || result === null) {
      return result;
    }

    if (Array.isArray(result)) {
      return result.map(this.#transformKeys);
    }

    return mapKeys(result, (_, key) => camelCase(key));
  };

  #createTables = async () => {
    const schemas = [fileSchema, materialsSchema];

    await Promise.all(
      schemas.map(async ({ tableName, builder }) => {
        if (!(await this.knex.schema.hasTable(tableName))) {
          return this.knex.schema.createTable(tableName, partialRight(builder, this.knex));
        }
      }),
    );
  };
}

export default new SqliteDb();
