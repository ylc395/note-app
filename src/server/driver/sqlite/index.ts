import knex, { type Knex } from 'knex';
import snakeCase from 'lodash/snakeCase';
import memoize from 'lodash/memoize';
import camelCase from 'lodash/camelCase';
import mapKeys from 'lodash/mapKeys';
import once from 'lodash/once';
import { PropagatedTransaction } from '@mokuteki/propagated-transactions';
import { Emitter } from 'strict-event-emitter';
import { ensureDirSync, emptyDirSync } from 'fs-extra';
import { join } from 'node:path';

import type { Database, DbConfig } from 'infra/database';
import type Repository from 'service/repository';

import * as schemas from './schema';
import * as repositories from './repository';
import type { Schema } from './schema/type';
import SqliteSearchEngine from './SearchEngine';
import SqliteKvDb from './KvDatabase';

export default class SqliteDb implements Database {
  private knex?: Knex;
  private readonly emitter = new Emitter<{ ready: [] }>();

  transactionManager = new PropagatedTransaction({
    start: async () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const trx = await this.knex!.transaction();
      return trx;
    },
    commit: async (trx) => {
      await trx.commit();
    },

    rollback: async (trx) => {
      await trx.rollback();
    },
  });

  getRepository<T extends keyof Repository>(name: T) {
    const knex = this.transactionManager.connection || this.knex;
    return new repositories[name](knex) as unknown as Repository[T];
  }

  readonly init = once(async ({ dir }: DbConfig) => {
    if (!dir) {
      throw new Error('no dir');
    }

    this.knex = await this.createDb(dir);
    this.emitter.emit('ready');
    await this.createTables();
  });

  getKnex() {
    if (this.knex) {
      return Promise.resolve(this.knex);
    }

    return new Promise<Knex>((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.emitter.on('ready', () => resolve(this.knex!));
    });
  }

  private async createDb(dir: string) {
    if (this.knex) {
      throw new Error('db existed');
    }

    ensureDirSync(dir);

    const isDevelopment = process.env.NODE_ENV === 'development';
    const needClean = process.env.DEV_CLEAN === '1';

    if (isDevelopment && needClean) {
      emptyDirSync(dir);
    }

    return knex({
      client: 'sqlite3',
      connection: join(dir, 'db.sqlite'),
      debug: isDevelopment,
      postProcessResponse: SqliteDb.transformKeys,
      useNullAsDefault: true,
      wrapIdentifier: (value, originImpl) => originImpl(snakeCase(value)),
    });
  }

  private async createTables() {
    const _schemas: Schema[] = Object.values(schemas);
    await Promise.all(
      _schemas.map(async ({ tableName, fields, restrictions }) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const { schema } = this.knex!;

        if (!(await schema.hasTable(tableName))) {
          return schema.createTable(tableName, (table) => this.builder(table, fields, restrictions));
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
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        col.defaultTo(typeof options.defaultTo === 'function' ? options.defaultTo(this.knex!) : options.defaultTo);
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

  private static transformKeys(result: unknown): unknown {
    if (typeof result !== 'object' || result instanceof Date || result === null) {
      return result;
    }

    if (Array.isArray(result)) {
      return result.map(SqliteDb.transformKeys);
    }

    return mapKeys(result, (_, key) => camelCase(key));
  }
}

export const dbFactory = memoize(() => new SqliteDb());
export const searchEngineFactory = memoize(() => new SqliteSearchEngine(dbFactory()));
export const kvDbFactory = memoize(() => new SqliteKvDb(dbFactory()));
