import { type Kysely, type Generated, sql } from 'kysely';

export const tableName = 'annotations';

export interface Row {
  id: string;
  targetId: string;
  body: Generated<string>;
  selectors: string;
  targetText: string | null;
  createdAt: Generated<number>;
  updatedAt: Generated<number>;
}

export default {
  tableName,
  builder: (db: Kysely<unknown>) => {
    return db.schema
      .createTable(tableName)
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())
      .addColumn('targetId', 'text', (col) => col.notNull())
      .addColumn('targetText', 'text')
      .addColumn('body', 'text', (col) => col.notNull().defaultTo(''))
      .addColumn('selectors', 'text', (col) => col.notNull())
      .addColumn('color', 'text', (col) => col.notNull())
      .addColumn('createdAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch('subsec') * 1000)`))
      .addColumn('updatedAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch('subsec') * 1000)`));
  },
} as const;
