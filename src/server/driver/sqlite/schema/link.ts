import type { Kysely } from 'kysely';

export interface Row {
  fromEntityId: string;
  fromPosition: `${number},${number}`;
  toEntityId: string;
  toFragmentId: string;
  createdAt: number;
}

export const tableName = 'links';

export default {
  tableName,
  builder: (db: Kysely<unknown>) => {
    return db.schema
      .createTable(tableName)
      .addColumn('fromEntityId', 'text', (col) => col.notNull())
      .addColumn('fromPosition', 'text', (col) => col.notNull())
      .addColumn('toEntityId', 'text', (col) => col.notNull())
      .addColumn('toFragmentId', 'text', (col) => col.notNull())
      .addColumn('createdAt', 'integer', (col) => col.notNull());
  },
} as const;
