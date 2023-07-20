import { Kysely, SqliteDialect, CamelCasePlugin, type Transaction } from 'kysely';
import { AsyncLocalStorage } from 'node:async_hooks';
import BetterSqlite3 from 'better-sqlite3';
import { ensureDirSync, emptyDirSync } from 'fs-extra';
import { join } from 'node:path';
import { Inject, Injectable, Logger } from '@nestjs/common';

import { token as appClientToken } from 'infra/AppClient';
import type AppClient from 'infra/AppClient';
import type { Database } from 'infra/database';
import { NODE_ENV } from 'infra/constants';
import type Repository from 'service/repository';

import * as schemas from './schema';
import type * as RowTypes from './schema';
import * as repositories from './repository';

export interface Db {
  [schemas.note.tableName]: RowTypes.NoteRow;
  [schemas.recyclable.tableName]: RowTypes.RecyclableRow;
  [schemas.star.tableName]: RowTypes.StarRow;
  [schemas.file.tableName]: RowTypes.FileRow;
  [schemas.materialAnnotation.tableName]: RowTypes.MaterialAnnotationRow;
  [schemas.revision.tableName]: RowTypes.RevisionRow;
  [schemas.material.tableName]: RowTypes.MaterialRow;
  [schemas.memo.tableName]: RowTypes.MemoRow;
  [schemas.syncEntity.tableName]: RowTypes.SyncEntityRow;
  sqlite_master: { name: string; type: string };
}

@Injectable()
export default class SqliteDb implements Database {
  private readonly logger: Logger;
  constructor(@Inject(appClientToken) private readonly appClient: AppClient) {
    this.logger = new Logger(`${appClient.type} ${SqliteDb.name}`);
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
    return new repositories[name](this.getDb()) as unknown as Repository[T];
  }

  private async init() {
    this.tableNames = (
      await this.db.selectFrom('sqlite_master').select('name').where('type', '=', 'table').execute()
    ).map(({ name }) => name);

    await this.createTables();
  }

  getDb() {
    return this.als.getStore() || this.db;
  }

  private createDb() {
    const dir = this.appClient.getDataDir();
    ensureDirSync(dir);

    const isDevelopment = NODE_ENV === 'development';
    const isTest = NODE_ENV === 'test';
    const needClean = process.env.DEV_CLEAN === '1';

    if ((isDevelopment && needClean && this.appClient.type === 'electron') || isTest) {
      emptyDirSync(dir);
    }

    const dbPath = join(dir, 'db.sqlite');
    this.logger.verbose(dbPath);

    return new Kysely<Db>({
      dialect: new SqliteDialect({
        database: new BetterSqlite3(dbPath, {
          verbose: isDevelopment ? this.logger.verbose.bind(this.logger) : undefined,
        }),
      }),
      plugins: [new CamelCasePlugin()],
    });
  }

  private async createTables() {
    for (const schema of Object.values(schemas)) {
      if (this.hasTable(schema.tableName)) {
        continue;
      }

      await schema.builder(this.db.schema).execute();
    }
  }
}
