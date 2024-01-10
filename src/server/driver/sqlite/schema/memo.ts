import { type Kysely, type Generated, sql } from 'kysely';

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
  builder: (db: Kysely<unknown>) => {
    return db.schema
      .createTable(tableName)
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())
      .addColumn('content', 'text', (col) => col.notNull())
      .addColumn('parentId', 'text')
      .addColumn('isPinned', 'integer', (col) => col.notNull().defaultTo(0))
      .addColumn('userUpdatedAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch('subsec') * 1000)`))
      .addColumn('createdAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch('subsec') * 1000)`))
      .addColumn('updatedAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch('subsec') * 1000)`));
  },
} as const;
