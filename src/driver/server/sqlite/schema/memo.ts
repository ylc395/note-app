import { type Kysely, type Generated, sql } from 'kysely';

export const tableName = 'memos';

export interface Row {
  id: string;
  body: string;
  parentId: string | null;
  sourceUrl: string | null;
  isPinned: Generated<0 | 1>;
  createdAt: Generated<number>;
  updatedAt: Generated<number>;
}

export default {
  tableName,
  builder: (db: Kysely<unknown>) => {
    return db.schema
      .createTable(tableName)
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())
      .addColumn('body', 'text', (col) => col.notNull())
      .addColumn('parentId', 'text')
      .addColumn('isPinned', 'integer', (col) => col.notNull().defaultTo(0))
      .addColumn('sourceUrl', 'text')
      .addColumn('createdAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch('subsec') * 1000)`))
      .addColumn('updatedAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch('subsec') * 1000)`));
  },
} as const;
