import type { Generated, Kysely } from 'kysely';

export const tableName = 'annotations';

export interface Row {
  id: string;
  targetId: string;
  body: Generated<string>;
  color: string;
  selectors: string;
  createdAt: number;
  updatedAt: number;
}

export default {
  tableName,
  builder: (db: Kysely<unknown>) => {
    return db.schema
      .createTable(tableName)
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())
      .addColumn('targetId', 'text', (col) => col.notNull())
      .addColumn('body', 'text', (col) => col.notNull().defaultTo(''))
      .addColumn('selectors', 'text', (col) => col.notNull())
      .addColumn('color', 'text', (col) => col.notNull())
      .addColumn('createdAt', 'integer', (col) => col.notNull())
      .addColumn('updatedAt', 'integer', (col) => col.notNull());
  },
} as const;
