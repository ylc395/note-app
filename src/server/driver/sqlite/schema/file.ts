import { type Kysely, type Generated, sql } from 'kysely';

export interface Row {
  id: string;
  data: ArrayBuffer | string;
  lang: string;
  mimeType: string;
  size: number;
  hash: string;
  createdAt: Generated<number>;
  textExtracted: Generated<number>;
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
      .addColumn('textExtracted', 'integer', (col) => col.notNull().defaultTo(0))
      .addColumn('createdAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch('subsec') * 1000)`))
      .addColumn('hash', 'text', (col) => col.notNull());
  },
} as const;
