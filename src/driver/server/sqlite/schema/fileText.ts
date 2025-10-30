import type { JSONColumnType, Kysely } from 'kysely';
import type { FileTextRecord } from '#domain/server/model/file';

export interface Row {
  fileId: string;
  text: string;
  lang: JSONColumnType<NonNullable<FileTextRecord['lang']>> | null;
  location: JSONColumnType<FileTextRecord['location']>;
}

export const tableName = 'file_texts';

export default {
  tableName,
  builder: (db: Kysely<unknown>) => {
    return db.schema
      .createTable(tableName)
      .addColumn('fileId', 'text', (col) => col.notNull())
      .addColumn('text', 'text', (col) => col.notNull())
      .addColumn('lang', 'text')
      .addColumn('location', 'text', (col) => col.notNull());
  },
} as const;
