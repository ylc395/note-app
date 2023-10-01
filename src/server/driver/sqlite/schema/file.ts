import type { SchemaModule, Generated } from 'kysely';

export interface Row {
  id: string;
  data: ArrayBuffer | string;
  text: string | null;
  mimeType: string;
  size: number;
  hash: string;
  textExtracted: Generated<number>;
}

export const tableName = 'files';

export default {
  tableName,
  builder: (schema: SchemaModule) => {
    return schema
      .createTable(tableName)
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())
      .addColumn('data', 'binary', (col) => col.notNull())
      .addColumn('mimeType', 'text', (col) => col.notNull())
      .addColumn('size', 'integer', (col) => col.notNull())
      .addColumn('textExtracted', 'integer', (col) => col.notNull().defaultTo(0))
      .addColumn('hash', 'text', (col) => col.notNull());
  },
} as const;
