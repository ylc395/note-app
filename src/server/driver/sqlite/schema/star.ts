import type { Kysely } from 'kysely';

export const tableName = 'stars';

export interface Row {
  entityId: string;
  isValid: 0 | 1;
  updatedAt: number;
}

export default {
  tableName,
  builder: (db: Kysely<unknown>) => {
    return db.schema
      .createTable(tableName)
      .addColumn('entityId', 'text', (col) => col.notNull())
      .addColumn('isValid', 'integer', (col) => col.notNull())
      .addColumn('updatedAt', 'integer', (col) => col.notNull());
  },
} as const;
