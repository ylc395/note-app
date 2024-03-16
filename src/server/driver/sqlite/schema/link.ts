import type { Kysely } from 'kysely';

export interface Row {
  sourceId: string;
  targetId: string;
}

export const tableName = 'links';

export default {
  tableName,
  builder: (db: Kysely<unknown>) => {
    return db.schema
      .createTable(tableName)
      .addColumn('sourceId', 'text', (col) => col.notNull())
      .addColumn('targetId', 'text', (col) => col.notNull());
  },
} as const;
