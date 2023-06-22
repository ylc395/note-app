import { Kysely, SqliteDialect, CamelCasePlugin, type Transaction } from 'kysely';
import { AsyncLocalStorage } from 'node:async_hooks';
import BetterSqlite3 from 'better-sqlite3';
import { ensureDirSync, emptyDirSync } from 'fs-extra';
import { join } from 'node:path';
import { Inject, Injectable } from '@nestjs/common';

import { token as appClientToken, AppClient } from 'infra/appClient';
import type { Database } from 'infra/database';
import type Repository from 'service/repository';

import * as schemas from './schema';
import type * as RowTypes from './schema';
import * as repositories from './repository';
import type { Schema } from './schema/type';

export interface Db {
  [schemas.noteSchema.tableName]: RowTypes.NoteRow;
  [schemas.recyclableSchema.tableName]: RowTypes.RecyclableRow;
  [schemas.starSchema.tableName]: RowTypes.StarRow;
  [schemas.resourceSchema.tableName]: RowTypes.ResourceRow;
  [schemas.fileSchema.tableName]: RowTypes.FileRow;
  [schemas.materialAnnotationSchema.tableName]: RowTypes.MaterialAnnotationRow;
  [schemas.revisionSchema.tableName]: RowTypes.RevisionRow;
  [schemas.materialSchema.tableName]: RowTypes.MaterialRow;
  [schemas.memoSchema.tableName]: RowTypes.MemoRow;
  [schemas.syncEntitySchema.tableName]: RowTypes.SyncEntityRow;
  sqlite_master: { name: string; type: string };
}

@Injectable()
export default class SqliteDb implements Database {
  constructor(@Inject(appClientToken) private readonly appClient: AppClient) {
    this.db = this.createDb();
    this.ready = this.init();
  }

  private db: Kysely<Db>;
  private readonly als = new AsyncLocalStorage<Transaction<Db>>();
  readonly ready: Promise<void>;
  private tableNames?: string[];

  hasTable(name: string) {
    if (!this.tableNames) {
      throw new Error('no table names');
    }

    return this.tableNames.includes(name);
  }

  transaction<T>(cb: () => Promise<T>): Promise<T> {
    return this.db.transaction().execute((trx) => {
      return this.als.run(trx, cb);
    });
  }

  getRepository<T extends keyof Repository>(name: T) {
    const db = this.als.getStore() || this.db;
    return new repositories[name](db) as unknown as Repository[T];
  }

  private async init() {
    this.tableNames = (
      await this.db.selectFrom('sqlite_master').select('name').where('type', '=', 'table').execute()
    ).map(({ name }) => name);

    await this.createTables();
  }

  getDb() {
    return this.db;
  }

  private createDb() {
    const dir = this.appClient.getDataDir();
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
    for (const { tableName, fields, restrictions } of Object.values(schemas) as Schema[]) {
      if (this.hasTable(tableName)) {
        continue;
      }

      let table = this.db.schema.createTable(tableName);

      for (const [fieldName, options] of Object.entries(fields)) {
        table = table.addColumn(fieldName, options.type, (col) => {
          let _col = col;
          if (options.primary) {
            _col = _col.primaryKey();
          }

          if (options.notNullable) {
            _col = _col.notNull();
          }

          if (options.unique) {
            _col = _col.unique();
          }

          if (typeof options.defaultTo !== 'undefined') {
            _col = _col.defaultTo(options.defaultTo);
          }

          return _col;
        });
      }

      if (restrictions) {
        if (restrictions.unique) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          table = table.addUniqueConstraint(restrictions.unique.join('-'), restrictions.unique as any);
        }

        if (restrictions.foreign) {
          for (const [col, foreignCol] of Object.entries(restrictions.foreign)) {
            const [foreignTableName, foreignColName] = foreignCol.split('.');
            if (!foreignTableName || !foreignColName) {
              throw new Error('invalid foreign key');
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            table = table.addForeignKeyConstraint(`${col}_foreign`, [col] as any, foreignTableName, [foreignColName]);
          }
        }
      }
      await table.execute();
    }
  }
}
