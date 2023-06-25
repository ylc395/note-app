import { type SchemaModule, type Generated, sql } from 'kysely';
import { tableName as filesTableName } from './file';

export const tableName = 'resources';

export interface Row {
  id: string;
  name: string;
  sourceUrl: string | null;
  fileId: string;
  createdAt: Generated<number>;
  updatedAt: Generated<number>;
}

export default {
  tableName,
  builder: (schema: SchemaModule) => {
    return schema
      .createTable(tableName)
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())
      .addColumn('name', 'text', (col) => col.notNull())
      .addColumn('sourceUrl', 'text')
      .addColumn('fileId', 'text', (col) => col.notNull())
      .addColumn('createdAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch())`))
      .addColumn('updatedAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch())`))
      .addForeignKeyConstraint('fileId-foreign', ['fileId'], filesTableName, ['id']);
  },
} as const;
