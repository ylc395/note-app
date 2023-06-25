import { type Generated, type SchemaModule, sql } from 'kysely';
import { tableName as filesTableName } from './file';

export const tableName = 'materials';

export interface Row {
  id: string;
  name: Generated<string>;
  fileId: string | null;
  parentId: string | null;
  sourceUrl: string | null;
  icon: string | null;
  createdAt: Generated<number>;
  updatedAt: Generated<number>;
}

export default {
  tableName,
  builder: (schema: SchemaModule) => {
    return schema
      .createTable(tableName)
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())
      .addColumn('name', 'text', (col) => col.notNull().defaultTo(''))
      .addColumn('fileId', 'text')
      .addColumn('parentId', 'text')
      .addColumn('sourceUrl', 'text')
      .addColumn('icon', 'text')
      .addColumn('createdAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch())`))
      .addColumn('updatedAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch())`))
      .addForeignKeyConstraint('fileId-foreign', ['fileId'], filesTableName, ['id']);
  },
} as const;
