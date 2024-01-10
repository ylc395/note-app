import { Kysely, SqliteDialect, CamelCasePlugin, type Transaction } from 'kysely';
import { AsyncLocalStorage } from 'node:async_hooks';
import BetterSqlite3 from 'better-sqlite3';
import fs from 'fs-extra';
import path, { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';
import { Inject, Injectable, Logger } from '@nestjs/common';

import { type default as Runtime, token as runtimeToken } from '@domain/infra/DesktopRuntime.js';
import type { Database } from '@domain/infra/database.js';
import { IS_TEST, IS_DEV } from '@domain/infra/constants.js';
import type Repository from '@domain/service/repository/index.js';

import { type Schemas, schemas } from './schema/index.js';
import * as repositories from './repository/index.js';
import SqliteKvDatabase from './KvDatabase.js';

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
    assert(this.tableNames);
    return this.tableNames.includes(name);
  }

  transaction<T>(cb: () => Promise<T>) {
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
    const tables = await this.db
      .selectFrom('sqlite_master')
      .select('name')
      .where('type', 'in', ['table', 'view'])
      .execute();

    this.tableNames = tables.map(({ name }) => name);

    await this.createTables();
    await this.kv.init();
  }

  getDb() {
    return this.als.getStore() || this.db;
  }

  private createDb() {
    const { rootPath } = this.app.getPaths();
    const dbPath = join(rootPath, 'db.sqlite');

    if ((CLEAN_DB && this.app.isMain()) || IS_TEST) {
      fs.removeSync(dbPath);
    }

    this.logger.verbose(dbPath);

    const db = new BetterSqlite3(dbPath, {
      verbose: IS_DEV ? this.logger.verbose.bind(this.logger) : undefined,
    });

    db.loadExtension(join(path.dirname(fileURLToPath(import.meta.url)), 'simple-tokenizer/libsimple'));

    return new Kysely<Db>({
      dialect: new SqliteDialect({
        database: db,
      }),
      plugins: [new CamelCasePlugin()],
    });
  }

  private async createTables() {
    for (const schema of schemas) {
      if (!this.hasTable(schema.tableName)) {
        await schema.builder(this.db as never).execute();
      }
    }
  }
}
