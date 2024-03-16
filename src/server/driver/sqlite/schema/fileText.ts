import type { Kysely } from 'kysely';

export interface Row {
  fileId: string;
  text: string;
  location: string;
}

export const tableName = 'file_texts';

export default {
  tableName,
  builder: (db: Kysely<unknown>) => {
    return db.schema
      .createTable(tableName)
      .addColumn('fileId', 'text', (col) => col.notNull())
      .addColumn('text', 'text', (col) => col.notNull())
      .addColumn('location', 'text', (col) => col.notNull());
  },
} as const;
