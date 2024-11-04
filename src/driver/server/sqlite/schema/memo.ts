import type { Kysely, Generated } from 'kysely';

export const tableName = 'memos';

export interface Row {
  id: string;
  body: Generated<string>;
  parentId: string | null;
  index: number;
  isPinned: Generated<0 | 1>;
  createdAt: number;
  updatedAt: number;
}

export default {
  tableName,
  builder: (db: Kysely<unknown>) => {
    return db.schema
      .createTable(tableName)
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())
      .addColumn('body', 'text', (col) => col.notNull().defaultTo(''))
      .addColumn('parentId', 'text')
      .addColumn('index', 'integer', (col) => col.notNull())
      .addColumn('isPinned', 'integer', (col) => col.notNull().defaultTo(0))
      .addColumn('createdAt', 'integer', (col) => col.notNull())
      .addColumn('updatedAt', 'integer', (col) => col.notNull());
  },
} as const;
