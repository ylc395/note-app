import type { Kysely } from 'kysely';

export const tableName = 'revisions';

export interface Row {
  id: string;
  entityId: string;
  titleDiff: string | null;
  bodyDiff: string | null;
  previousId: string | null;
  appName: string;
  deviceName: string;
  name: string | null;
  createdAt: number;
  isAuto: 0 | 1;
}

export default {
  tableName,
  builder: (db: Kysely<unknown>) => {
    return db.schema
      .createTable(tableName)
      .addColumn('id', 'text', (col) => col.notNull())
      .addColumn('entityId', 'text', (col) => col.notNull())
      .addColumn('name', 'text')
      .addColumn('isAuto', 'integer', (col) => col.notNull())
      .addColumn('titleDiff', 'text')
      .addColumn('bodyDiff', 'text')
      .addColumn('previousId', 'text')
      .addColumn('appName', 'text', (col) => col.notNull())
      .addColumn('deviceName', 'text', (col) => col.notNull())
      .addColumn('createdAt', 'integer', (col) => col.notNull());
  },
} as const;
