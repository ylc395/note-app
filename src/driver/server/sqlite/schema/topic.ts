import type { TopicRecord } from '#domain/server/model/content';
import type { JSONColumnType, Kysely } from 'kysely';

export const tableName = 'topics';

export interface Row {
  name: string;
  entityId: string;
  location: JSONColumnType<TopicRecord['location']>;
  level: TopicRecord['level'];
}

export default {
  tableName,
  builder: (db: Kysely<unknown>) => {
    return db.schema
      .createTable(tableName)
      .addColumn('name', 'text', (col) => col.notNull())
      .addColumn('entityId', 'text', (col) => col.notNull())
      .addColumn('level', 'integer', (col) => col.notNull())
      .addColumn('location', 'text', (col) => col.notNull());
  },
} as const;
