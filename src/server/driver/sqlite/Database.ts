import { Kysely, SqliteDialect, CamelCasePlugin, type Transaction } from 'kysely';
import { AsyncLocalStorage } from 'node:async_hooks';
import BetterSqlite3 from 'better-sqlite3';
import snakeCase from 'lodash/snakeCase';
import { Emitter } from 'strict-event-emitter';
import { ensureDirSync, emptyDirSync } from 'fs-extra';
import { join } from 'node:path';
import { Inject, Injectable } from '@nestjs/common';

import { token as appClientToken, AppClient } from 'infra/appClient';
import type { Database } from 'infra/database';
import type Repository from 'service/repository';

import * as schemas from './schema';
import * as repositories from './repository';
import type { Schema, InferRow } from './schema/type';

export interface Db {
  [schemas.noteSchema.tableName]: InferRow<(typeof schemas.noteSchema)['fields']>;
  [schemas.recyclableSchema.tableName]: InferRow<(typeof schemas.recyclableSchema)['fields']>;
  [schemas.starSchema.tableName]: InferRow<(typeof schemas.starSchema)['fields']>;
  [schemas.resourceSchema.tableName]: InferRow<(typeof schemas.resourceSchema)['fields']>;
  [schemas.fileSchema.tableName]: InferRow<(typeof schemas.fileSchema)['fields']>;
  [schemas.materialAnnotationSchema.tableName]: InferRow<(typeof schemas.materialAnnotationSchema)['fields']>;
  [schemas.revisionSchema.tableName]: InferRow<(typeof schemas.revisionSchema)['fields']>;
  [schemas.materialSchema.tableName]: InferRow<(typeof schemas.materialSchema)['fields']>;
  [schemas.memoSchema.tableName]: InferRow<(typeof schemas.memoSchema)['fields']>;
  [schemas.syncEntitySchema.tableName]: InferRow<(typeof schemas.syncEntitySchema)['fields']>;
  sqlite_master: { name: string; type: string };
}

@Injectable()
export default class SqliteDb implements Database {
  constructor(@Inject(appClientToken) private readonly appClient: AppClient) {
    this.ready = this.init();
  }

  private db?: Kysely<Db>;
  private readonly als = new AsyncLocalStorage<Transaction<Db>>();
  private readonly emitter = new Emitter<{ ready: [] }>();
  readonly ready: Promise<void>;
  private tableNames?: string[];

  hasTable(name: string) {
    if (!this.tableNames) {
      throw new Error('no table names');
    }

    return this.tableNames.includes(name);
  }

  transaction<T>(cb: () => Promise<T>): Promise<T> {
    if (!this.db) {
      throw new Error('no db');
    }

    return this.db.transaction().execute((trx) => {
      return this.als.run(trx, cb);
    });
  }

  getRepository<T extends keyof Repository>(name: T) {
    if (!this.db) {
      throw new Error('no db');
    }

    const db = this.als.getStore() || this.db;
    return new repositories[name](db) as unknown as Repository[T];
  }

  private async init() {
    const dir = this.appClient.getDataDir();

    this.db = SqliteDb.createDb(dir);
    this.tableNames = (
      await this.db.selectFrom('sqlite_master').select('name').where('type', '=', 'table').execute()
    ).map(({ name }) => name);

    await this.createTables();
    this.emitter.emit('ready');
  }

  getDb() {
    if (this.db) {
      return Promise.resolve(this.db);
    }

    return new Promise<Kysely<Db>>((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.emitter.on('ready', () => resolve(this.db!));
    });
  }

  private static createDb(dir: string) {
    ensureDirSync(dir);

    const isDevelopment = process.env.NODE_ENV === 'development';
    const needClean = process.env.DEV_CLEAN === '1';

    if (isDevelopment && needClean) {
      emptyDirSync(dir);
    }

    return new Kysely<Db>({
      dialect: new SqliteDialect({
        database: new BetterSqlite3(join(dir, 'db.sqlite'), { verbose: isDevelopment ? console.log : undefined }),
      }),
      plugins: [new CamelCasePlugin()],
    });
  }

  private async createTables() {
    await Promise.all(
      (Object.values(schemas) as Schema[]).map(async ({ tableName, fields, restrictions }) => {
        if (this.hasTable(tableName)) {
          return;
        }

        if (!this.db) {
          throw new Error('no db');
        }

        const { schema } = this.db;
        const table = schema.createTable(tableName);

        for (const [fieldName, options] of Object.entries(fields)) {
          table.addColumn(snakeCase(fieldName), options.type, (col) => {
            if (options.primary) {
              col.primaryKey();
            }

            if (options.notNullable) {
              col.notNull();
            }

            if (options.unique) {
              col.unique();
            }

            if (typeof options.defaultTo !== 'undefined') {
              col.defaultTo(options.defaultTo);
            }

            return col;
          });

          if (restrictions) {
            if (restrictions.unique) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              table.addUniqueConstraint(restrictions.unique.join('-'), restrictions.unique as any);
            }

            if (restrictions.foreign) {
              for (const [col, foreignCol] of Object.entries(restrictions.foreign)) {
                const [foreignTableName, foreignColName] = foreignCol.split('.');
                if (!foreignTableName || !foreignColName) {
                  throw new Error('invalid foreign key');
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                table.addForeignKeyConstraint(`${col}_foreign`, [col] as any, foreignTableName, [foreignColName]);
              }
            }
          }
        }
      }),
    );
  }
}
