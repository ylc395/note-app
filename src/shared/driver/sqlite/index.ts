import { join } from 'node:path';
import { ensureDirSync, emptyDirSync } from 'fs-extra';
import { Emitter } from 'strict-event-emitter';
import knex, { type Knex } from 'knex';
import camelCase from 'lodash/camelCase';
import mapKeys from 'lodash/mapKeys';
import snakeCase from 'lodash/snakeCase';

function transformKeys(result: unknown): unknown {
  if (typeof result !== 'object' || result instanceof Date || result === null) {
    return result;
  }

  if (Array.isArray(result)) {
    return result.map(transformKeys);
  }

  return mapKeys(result, (_, key) => camelCase(key));
}

let db: Knex | undefined;

const eventemitter = new Emitter<{ init: [Knex] }>();

export function getDb() {
  if (!db) {
    return new Promise<Knex>((resolve) => {
      eventemitter.once('init', (e: Knex) => resolve(e));
    });
  }

  return Promise.resolve(db);
}

export function createDb(dir: string) {
  if (db) {
    throw new Error('db existed');
  }

  ensureDirSync(dir);

  const isDevelopment = process.env.NODE_ENV === 'development';
  const needClean = process.env.DEV_CLEAN === '1';

  if (isDevelopment && needClean) {
    emptyDirSync(dir);
  }

  db = knex({
    client: 'sqlite3',
    connection: join(dir, 'db.sqlite'),
    debug: isDevelopment,
    postProcessResponse: transformKeys,
    useNullAsDefault: true,
    wrapIdentifier: (value, originImpl) => originImpl(snakeCase(value)),
  });

  console.log(`sqlite: initialized in ${dir}`);
  eventemitter.emit('init', db);

  return db;
}
