import type { JSONColumnType, Kysely } from 'kysely';
import type { TopicRecord } from '#domain/server/model/topic.js';

export const tableName = 'topics';

export interface Row {
  name: string;
  entityId: string;
  location: JSONColumnType<TopicRecord['location']>;
}

export default {
  tableName,
  builder: (db: Kysely<unknown>) => {
    return db.schema
      .createTable(tableName)
      .addColumn('name', 'text', (col) => col.notNull())
      .addColumn('entityId', 'text', (col) => col.notNull())
      .addColumn('location', 'text', (col) => col.notNull());
  },
} as const;
