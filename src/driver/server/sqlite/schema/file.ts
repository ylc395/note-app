import { GeneratedAlways, sql, type JSONColumnType, type Kysely } from 'kysely';
import type { File } from '#domain/shared/model/file';

export interface Row {
  id: string;
  data: Uint8Array | Buffer;
  lang: JSONColumnType<File['lang']>;
  mimeType: string;
  size: number;
  hash: string;
  createdAt: GeneratedAlways<number>;
  textUnitLength: number;
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
      .addColumn('textUnitLength', 'integer', (col) => col.notNull())
      .addColumn('createdAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch('subsec') * 1000)`))
      .addColumn('hash', 'text', (col) => col.notNull());
  },
} as const;
