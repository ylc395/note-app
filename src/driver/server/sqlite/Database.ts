import { Kysely, SqliteDialect, CamelCasePlugin, ParseJSONResultsPlugin, type Transaction } from 'kysely';
import { AsyncLocalStorage } from 'node:async_hooks';
import BetterSqlite3 from 'better-sqlite3';
import fs from 'fs-extra';
import { join } from 'node:path';
import assert from 'node:assert';

import { token as loggerToken } from '#domain/shared/infra/logger.js';
import type { Database } from '#domain/server/infra/database.js';
import { IS_TEST, IS_CLEAN_DEV, IS_DEV } from '#domain/shared/infra/env.js';
import container from '#utils/singletonContainer.js';

import { type Schemas, schemas } from './schema/index.js';

type Db = Schemas;

export default class SqliteDb implements Database {
  constructor({ dir }: { dir: string }) {
    const { db, rawDb } = this.connectToDb(dir);

    this.rawDb = rawDb;
    this.db = db;
    this.ready = this.initTables();
  }

  private readonly logger = container.resolve(loggerToken);
  private readonly db: Kysely<Db>;
  public readonly rawDb: BetterSqlite3.Database;
  private readonly als = new AsyncLocalStorage<Transaction<Db>>();
  public readonly ready: Promise<void>;
  private tableNames?: string[];

  public hasTable(name: string) {
    assert(this.tableNames);
    return this.tableNames.includes(name);
  }

  public transaction<T>(cb: () => Promise<T>) {
    const currentTrx = this.als.getStore();

    if (currentTrx) {
      // 事务不能嵌套。当前已在事务里了，就直接调用
      return cb();
    }

    return this.db.transaction().execute((trx) => {
      return this.als.run(trx, cb);
    });
  }

  private async initTables() {
    const tables = await this.db
      .selectFrom('sqlite_master')
      .select('name')
      .where('type', 'in', ['table', 'view'])
      .execute();

    this.tableNames = tables.map(({ name }) => name);

    for (const schema of schemas) {
      if (!this.hasTable(schema.tableName)) {
        await schema.builder(this.db as never).execute();
      }
    }
  }

  public getDb() {
    return this.als.getStore() || this.db;
  }

  private connectToDb(dir: string) {
    const dbPath = join(dir, 'db.sqlite');

    if (IS_CLEAN_DEV || IS_TEST) {
      fs.removeSync(dbPath);
    }

    this.logger.debug(dbPath);

    const db = new BetterSqlite3(dbPath, { verbose: this.logger.debug });

    return {
      rawDb: db,
      db: new Kysely<Db>({
        log: IS_DEV ? ['error'] : undefined,
        dialect: new SqliteDialect({ database: db }),
        plugins: [new CamelCasePlugin(), new ParseJSONResultsPlugin()],
      }),
    };
  }
}
