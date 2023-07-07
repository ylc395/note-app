import { type Generated, type SchemaModule, sql } from 'kysely';

export const tableName = 'notes';

export interface Row {
  id: string;
  title: Generated<string>;
  body: Generated<string>;
  parentId: string | null;
  createdAt: Generated<number>;
  updatedAt: Generated<number>;
  isReadonly: Generated<0 | 1>;
  icon: string | null;
}

export default {
  tableName,
  builder: (schema: SchemaModule) => {
    return schema
      .createTable(tableName)
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())
      .addColumn('title', 'text', (col) => col.notNull().defaultTo(''))
      .addColumn('body', 'text', (col) => col.notNull().defaultTo(''))
      .addColumn('parentId', 'text')
      .addColumn('createdAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch())`))
      .addColumn('updatedAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch())`))
      .addColumn('isReadonly', 'integer', (col) => col.notNull().defaultTo(0))
      .addColumn('icon', 'text');
  },
} as const;
