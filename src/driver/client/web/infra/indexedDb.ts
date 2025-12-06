import assert from 'assert';
import { openDB, type IDBPDatabase } from 'idb';
import type { ZodType } from 'zod';

import { APP_NAME } from '#domain/shared/infra/constants';
import { storeName as editorUIStoreName } from '#domain/client/app/model/note/editor/BaseEditor';
import type { DocumentDb } from '#domain/client/shared/infra/documentDb';

class IndexedDb implements DocumentDb {
  private db?: IDBPDatabase;

  public async init() {
    this.db = await openDB(APP_NAME, 1, {
      upgrade: (db, oldVersion) => {
        if (oldVersion < 1) {
          db.createObjectStore(editorUIStoreName, { keyPath: 'id', autoIncrement: false });
        }
      },
    });
  }

  public async getByKey(storeName: string, value: string, schema?: ZodType) {
    assert(this.db);
    const record = await this.db.get(storeName, value);

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
