import { type SchemaModule, type Generated, sql } from 'kysely';

export const tableName = 'memos';

export interface Row {
  id: string;
  content: string;
  parentId: string | null;
  isPinned: 0 | 1;
  createdAt: Generated<number>;
  userUpdatedAt: Generated<number>;
  updatedAt: Generated<number>;
}

export default {
  tableName,
  builder: (schema: SchemaModule) => {
    return schema
      .createTable(tableName)
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())
      .addColumn('content', 'text', (col) => col.notNull())
      .addColumn('parentId', 'text')
      .addColumn('isPinned', 'integer', (col) => col.notNull().defaultTo(0))
      .addColumn('userUpdatedAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch())`))
      .addColumn('createdAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch())`))
      .addColumn('updatedAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch())`));
  },
} as const;
