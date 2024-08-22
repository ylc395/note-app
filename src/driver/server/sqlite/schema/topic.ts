import type { Kysely } from 'kysely';

export const tableName = 'topics';

export interface Row {
  name: string;
  entityId: string;
  locationStart: number;
  locationEnd: number;
  createdAt: number;
}

export default {
  tableName,
  builder: (db: Kysely<unknown>) => {
    return db.schema
      .createTable(tableName)
      .addColumn('name', 'text', (col) => col.notNull())
      .addColumn('entityId', 'text', (col) => col.notNull())
      .addColumn('locationStart', 'integer', (col) => col.notNull())
      .addColumn('locationEnd', 'integer', (col) => col.notNull())
      .addColumn('createdAt', 'integer', (col) => col.notNull());
  },
} as const;
