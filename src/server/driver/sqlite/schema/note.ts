import { type Generated, type Kysely, sql } from 'kysely';

export const tableName = 'notes';

export interface Row {
  id: string;
  title: Generated<string>;
  body: Generated<string>;
  parentId: string | null;
  createdAt: Generated<number>;
  updatedAt: Generated<number>;
  icon: string | null;
}

export default {
  tableName,
  builder: (db: Kysely<unknown>) => {
    return db.schema
      .createTable(tableName)
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())
      .addColumn('title', 'text', (col) => col.notNull().defaultTo(''))
      .addColumn('body', 'text', (col) => col.notNull().defaultTo(''))
      .addColumn('icon', 'text')
      .addColumn('parentId', 'text')
      .addColumn('createdAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch('subsec') * 1000)`))
      .addColumn('updatedAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch('subsec') * 1000)`));
  },
} as const;
