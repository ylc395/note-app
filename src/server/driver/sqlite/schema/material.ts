import { type Generated, type SchemaModule, sql } from 'kysely';
import { tableName as filesTableName } from './file';

export const tableName = 'materials';

export interface Row {
  id: string;
  title: Generated<string>;
  fileId: string | null;
  parentId: string | null;
  sourceUrl: string | null;
  icon: string | null;
  comment: Generated<string>;
  createdAt: Generated<number>;
  updatedAt: Generated<number>;
  userUpdatedAt: Generated<number>;
}

export default {
  tableName,
  builder: (schema: SchemaModule) => {
    return schema
      .createTable(tableName)
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())
      .addColumn('title', 'text', (col) => col.notNull().defaultTo(''))
      .addColumn('fileId', 'text')
      .addColumn('parentId', 'text')
      .addColumn('sourceUrl', 'text')
      .addColumn('comment', 'text', (col) => col.notNull().defaultTo(''))
      .addColumn('icon', 'text')
      .addColumn('createdAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch('subsec') * 1000)`))
      .addColumn('updatedAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch('subsec') * 1000)`))
      .addColumn('userUpdatedAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch('subsec') * 1000)`))
      .addForeignKeyConstraint('fileId-foreign', ['fileId'], filesTableName, ['id']);
  },
} as const;
