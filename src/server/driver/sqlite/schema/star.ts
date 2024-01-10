import type { Kysely } from 'kysely';
import type { StarEntityTypes } from '@domain/model/star.js';

export const tableName = 'stars';

export interface Row {
  id: string;
  entityType: StarEntityTypes;
  entityId: string;
}

export default {
  tableName,
  builder: (db: Kysely<unknown>) => {
    return db.schema
      .createTable(tableName)
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())

      .addColumn('entityType', 'integer', (col) => col.notNull())
      .addColumn('entityId', 'text', (col) => col.notNull())
      .addUniqueConstraint('type-id-unique', ['entityId', 'entityType']);
  },
} as const;
