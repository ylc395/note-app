import { type Kysely, type Generated, sql } from 'kysely';

export const tableName = 'versions';

export interface Row {
  id: string;
  device: string;
  entityId: string;
  comment: string;
  diff: string;
  isAuto: 0 | 1;
  createdAt: Generated<number>;
}

export default {
  tableName,
  builder: (db: Kysely<unknown>) => {
    return db.schema
      .createTable(tableName)
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())
      .addColumn('device', 'text', (col) => col.notNull())
      .addColumn('entityId', 'text', (col) => col.notNull())
      .addColumn('diff', 'text', (col) => col.notNull())
      .addColumn('comment', 'text', (col) => col.notNull().defaultTo(''))
      .addColumn('isAuto', 'integer', (col) => col.notNull())
      .addColumn('createdAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch('subsec') * 1000)`));
  },
} as const;
