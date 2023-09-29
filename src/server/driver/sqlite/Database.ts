import { Kysely, SqliteDialect, CamelCasePlugin, type Transaction } from 'kysely';
import { AsyncLocalStorage } from 'node:async_hooks';
import BetterSqlite3 from 'better-sqlite3';
import { ensureDirSync, emptyDirSync } from 'fs-extra';
import { join } from 'node:path';
import { Inject, Injectable, Logger } from '@nestjs/common';

import { type default as Runtime, token as runtimeToken } from 'infra/Runtime';
import type { Database } from 'infra/database';
import { IS_TEST, IS_DEV } from 'infra/constants';
import type Repository from 'service/repository';

import { type Schemas, schemas } from './schema';
import * as repositories from './repository';
import SqliteKvDatabase from './KvDatabase';

const CLEAN_DB = process.env.DEV_CLEAN === '1' && IS_DEV;

export interface Db extends Schemas {
  sqlite_master: { name: string; type: string };
}

@Injectable()
export default class SqliteDb implements Database {
  private readonly logger: Logger;
  constructor(@Inject(runtimeToken) private readonly app: Runtime) {
    this.logger = new Logger(`${app.isMain() ? 'main' : 'http'} ${SqliteDb.name}`);
    this.db = this.createDb();
    this.ready = this.init();
    this.kv = new SqliteKvDatabase(this);
  }

  private db: Kysely<Db>;
  readonly kv: SqliteKvDatabase;
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
    if (!(name in repositories)) {
      throw new Error('invalid repository name');
    }

    return new repositories[name](this) as unknown as Repository[T];
  }

  private async init() {
    this.tableNames = (
      await this.db.selectFrom('sqlite_master').select('name').where('type', '=', 'table').execute()
    ).map(({ name }) => name);

    await this.createTables();
    await this.kv.init();
  }

  getDb() {
    return this.als.getStore() || this.db;
  }

  private createDb() {
    const dir = this.app.getDataDir();
    ensureDirSync(dir);

    if ((CLEAN_DB && this.app.isMain()) || IS_TEST) {
      emptyDirSync(dir);
    }

    const dbPath = join(dir, 'db.sqlite');
    this.logger.verbose(dbPath);

    return new Kysely<Db>({
      dialect: new SqliteDialect({
        database: new BetterSqlite3(dbPath, {
          verbose: IS_DEV ? this.logger.verbose.bind(this.logger) : undefined,
        }),
      }),
      plugins: [new CamelCasePlugin()],
    });
  }

  private async createTables() {
    for (const schema of schemas) {
      if (this.hasTable(schema.tableName)) {
        continue;
      }

      await schema.builder(this.db.schema).execute();
    }
  }
}
