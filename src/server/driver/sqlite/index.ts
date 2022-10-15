import knex, { type Knex } from 'knex';
import knexStringcase from 'knex-stringcase';
import { join } from 'path';

import type { Database } from 'service/infra/Database';

import materialsSchema from './materialSchema';

const isDevelopment = process.env.NODE_ENV === 'development';

export default class SqliteDb implements Database {
  knex: Knex;
  readonly init = async (dir: string) => {
    this.knex = knex(
      knexStringcase({
        client: 'sqlite3',
        connection: join(dir, 'db.sqlite'),
        debug: isDevelopment,
        asyncStackTraces: isDevelopment,
        useNullAsDefault: true,
      }),
    );
    await this.#createTables();
  };

  #createTables = async () => {
    const schemas = [materialsSchema];

    await Promise.all(
      schemas.map(async ({ tableName, builder }) => {
        if (!(await this.knex.schema.hasTable(tableName))) {
          return this.knex.schema.createTable(tableName, builder);
        }
      }),
    );
  };
}
