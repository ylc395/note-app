import { container } from 'tsyringe';
import { Kysely, SqliteDialect, CamelCasePlugin, type Transaction } from 'kysely';
import { AsyncLocalStorage } from 'node:async_hooks';
import BetterSqlite3 from 'better-sqlite3';
import fs from 'fs-extra';
import path, { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

import { token as loggerToken } from '@domain/infra/logger.js';
import type { Database } from '@domain/infra/database.js';
import { IS_TEST, IS_DEV } from '@domain/infra/constants.js';
import type Repository from '@domain/service/repository/index.js';

import { type Schemas, schemas } from './schema/index.js';
import * as repositories from './repository/index.js';

const CLEAN_DB = process.env.DEV_CLEAN === '1' && IS_DEV;

export interface Db extends Schemas {
  sqlite_master: { name: string; type: string };
}

export default class SqliteDb implements Database {
  constructor(dir: string) {
    this.db = this.connectToDb(dir);
    this.ready = this.init();
  }

  private readonly logger = container.resolve(loggerToken);
  private db: Kysely<Db>;
  private readonly als = new AsyncLocalStorage<Transaction<Db>>();
  public readonly ready: Promise<void>;
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
  }

  getDb() {
    return this.als.getStore() || this.db;
  }

  private connectToDb(dir: string) {
    const dbPath = join(dir, 'db.sqlite');

    if (CLEAN_DB || IS_TEST) {
      fs.removeSync(dbPath);
    }

    this.logger.debug(dbPath);
    const db = new BetterSqlite3(dbPath, { verbose: (message) => this.logger.debug(`${message}\n`) });
    db.loadExtension(join(path.dirname(fileURLToPath(import.meta.url)), 'simple-tokenizer/libsimple'));

    return new Kysely<Db>({
      dialect: new SqliteDialect({ database: db }),
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
