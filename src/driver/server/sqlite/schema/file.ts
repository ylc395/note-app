import { GeneratedAlways, sql, type Generated, type JSONColumnType, type Kysely } from 'kysely';
import type { File } from '#domain/shared/model/file';

export interface Row {
  id: string;
  data: Uint8Array | Buffer;
  lang: JSONColumnType<File['lang']>;
  mimeType: string;
  size: number;
  hash: string;
  createdAt: GeneratedAlways<number>;
  isTemp: 0 | 1;
  textExtracted: Generated<0 | 1>;
}

export const tableName = 'files';

export default {
  tableName,
  builder: (db: Kysely<unknown>) => {
    return db.schema
      .createTable(tableName)
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())
      .addColumn('data', 'binary', (col) => col.notNull())
      .addColumn('mimeType', 'text', (col) => col.notNull())
      .addColumn('lang', 'text', (col) => col.notNull())
      .addColumn('size', 'integer', (col) => col.notNull())
      .addColumn('isTemp', 'integer', (col) => col.notNull())
      .addColumn('textExtracted', 'integer', (col) => col.notNull().defaultTo(0))
      .addColumn('createdAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch('subsec') * 1000)`))
      .addColumn('hash', 'text', (col) => col.notNull());
  },
} as const;
