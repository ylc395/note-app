import type { Kysely, Generated } from 'kysely';

export const tableName = 'memos';

export interface Row {
  id: string;
  body: string;
  bodyPlainText: string;
  parentId: string | null;
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
      .addColumn('body', 'text', (col) => col.notNull())
      .addColumn('bodyPlainText', 'text', (col) => col.notNull())
      .addColumn('parentId', 'text')
      .addColumn('isPinned', 'integer', (col) => col.notNull().defaultTo(0))
      .addColumn('createdAt', 'integer', (col) => col.notNull())
      .addColumn('updatedAt', 'integer', (col) => col.notNull());
  },
} as const;
