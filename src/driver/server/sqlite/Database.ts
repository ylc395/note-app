import { container } from 'tsyringe';
import { Kysely, SqliteDialect, CamelCasePlugin, type Transaction } from 'kysely';
import { AsyncLocalStorage } from 'node:async_hooks';
import BetterSqlite3 from 'better-sqlite3';
import fs from 'fs-extra';
import path, { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

import { token as loggerToken } from '#domain/shared/infra/logger.js';
import type { Database } from '#domain/server/infra/database.js';
import { IS_TEST, IS_DEV } from '#domain/shared/infra/constants.js';

import { type Schemas, schemas } from './schema/index.js';

const CLEAN_DB = process.env.DEV_CLEAN === '1' && IS_DEV;

export interface Db extends Schemas {
  sqlite_master: { name: string; type: string };
}

export default class SqliteDb implements Database {
  constructor({ dir }: { dir: string }) {
    this.db = this.connectToDb(dir);
    this.ready = this.init();
  }

  private readonly logger = container.resolve(loggerToken);
  private db: Kysely<Db>;
  private readonly als = new AsyncLocalStorage<Transaction<Db>>();
  public readonly ready: Promise<void>;
  private tableNames?: string[];

  public hasTable(name: string) {
    assert(this.tableNames);
    return this.tableNames.includes(name);
  }

  public transaction<T>(cb: () => Promise<T>) {
    return this.db.transaction().execute((trx) => {
      return this.als.run(trx, cb);
    });
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

  public getDb() {
    return this.als.getStore() || this.db;
  }

  private connectToDb(dir: string) {
    const dbPath = join(dir, 'db.sqlite');

    if (CLEAN_DB || IS_TEST) {
      fs.removeSync(dbPath);
    }

    this.logger.debug(dbPath);

    const extensionPath = join(path.dirname(fileURLToPath(import.meta.url)), 'simple-tokenizer/libsimple');
    const db = new BetterSqlite3(dbPath, { verbose: this.logger.debug }).loadExtension(extensionPath); // sqlite's built-in tokenizer can not handle CJK. so we use `simple tokenizer`

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
