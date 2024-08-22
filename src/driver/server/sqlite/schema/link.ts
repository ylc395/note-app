import type { Kysely } from 'kysely';

export interface Row {
  sourceId: string;
  sourceLocationStart: number;
  sourceLocationEnd: number;
  targetId: string;
  targetType: number;
  targetSelector: string | null;
}

export const tableName = 'links';

export default {
  tableName,
  builder: (db: Kysely<unknown>) => {
    return db.schema
      .createTable(tableName)
      .addColumn('sourceId', 'text', (col) => col.notNull())
      .addColumn('sourceLocationStart', 'integer', (col) => col.notNull())
      .addColumn('sourceLocationEnd', 'integer', (col) => col.notNull())
      .addColumn('targetId', 'text', (col) => col.notNull())
      .addColumn('targetType', 'integer', (col) => col.notNull())
      .addColumn('targetSelector', 'text');
  },
} as const;
