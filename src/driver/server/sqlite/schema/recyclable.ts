import { type Kysely, sql } from 'kysely';

export const tableName = 'recyclables';

export interface Row {
  entityId: string;
  reason: number;
  deletedAt: number;
}

export default {
  tableName,
  builder: (db: Kysely<unknown>) => {
    return db.schema
      .createTable(tableName)
      .addColumn('entityId', 'text', (col) => col.notNull())
      .addColumn('reason', 'integer', (col) => col.notNull())
      .addColumn('deletedAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch('subsec') * 1000)`));
  },
} as const;
