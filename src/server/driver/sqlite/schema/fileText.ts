import type { SchemaModule } from 'kysely';

export interface Row {
  fileId: string;
  text: string;
  position: string;
}

export const tableName = 'file_texts';

export default {
  tableName,
  builder: (schema: SchemaModule) => {
    return schema
      .createTable(tableName)
      .addColumn('fileId', 'text', (col) => col.notNull())
      .addColumn('text', 'binary', (col) => col.notNull())
      .addColumn('position', 'text', (col) => col.notNull());
  },
} as const;
