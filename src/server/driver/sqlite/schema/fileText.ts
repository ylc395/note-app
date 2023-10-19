import type { SchemaModule } from 'kysely';

export interface Row {
  fileId: string;
  text: string;
  page: number | null;
  location: string;
}

export const tableName = 'file_texts';

export default {
  tableName,
  builder: (schema: SchemaModule) => {
    return schema
      .createTable(tableName)
      .addColumn('fileId', 'text', (col) => col.notNull())
      .addColumn('text', 'text', (col) => col.notNull())
      .addColumn('page', 'integer')
      .addColumn('location', 'text', (col) => col.notNull());
  },
} as const;
