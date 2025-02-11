import type { Kysely } from 'kysely';

export interface Row {
  sourceId: string;
  sourceLocation: string;
  target: string;
  targetType: number;
  targetDomain: string | null;
  targetFragmentId: string | null;
}

export const tableName = 'links';

export default {
  tableName,
  builder: (db: Kysely<unknown>) => {
    return db.schema
      .createTable(tableName)
      .addColumn('sourceId', 'text', (col) => col.notNull())
      .addColumn('sourceLocation', 'text', (col) => col.notNull())
      .addColumn('target', 'text', (col) => col.notNull())
      .addColumn('targetType', 'integer', (col) => col.notNull())
      .addColumn('targetDomain', 'text')
      .addColumn('targetFragmentId', 'text');
  },
} as const;
