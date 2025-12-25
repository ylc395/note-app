import assert from 'assert';
import { deleteDB, openDB, type IDBPDatabase } from 'idb';
import type { ZodType } from 'zod';

import { APP_NAME } from '#domain/shared/infra/constants';
import {
  uiStateStoreName as editorUIStoreName,
  remoteIconStoreName,
} from '#domain/client/app/model/note/editor/BaseEditor';
import type { DocumentDb } from '#domain/client/shared/infra/documentDb';
import { IS_CLEAN_DEV } from '#domain/shared/infra/env';

class IndexedDb implements DocumentDb {
  private db?: IDBPDatabase;

  public async init() {
    if (IS_CLEAN_DEV) {
      await deleteDB(APP_NAME);
    }

    this.db = await openDB(APP_NAME, 1, {
      upgrade: (db, oldVersion) => {
        if (oldVersion < 1) {
          db.createObjectStore(editorUIStoreName, { keyPath: 'id' });
          db.createObjectStore(remoteIconStoreName, { keyPath: 'origin' });
        }
      },
    });
  }

  public async getByKey(storeName: string, key: string, schema?: ZodType) {
    assert(this.db);
    const record = await this.db.get(storeName, key);

    if (schema) {
      const parsed = schema.safeParse(record);
      return parsed.success ? parsed.data : null;
    }

    return record;
  }

  public async put(storeName: string, record: unknown) {
    assert(this.db);
    await this.db.put(storeName, record);
  }
}

export default new IndexedDb();
