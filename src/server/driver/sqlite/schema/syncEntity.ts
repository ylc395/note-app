import type { Kysely } from 'kysely';
import type { EntityTypes } from '@domain/model/entity.js';

export const tableName = 'sync_entities';

export interface Row {
  entityType: EntityTypes;
  entityId: string;
  syncAt: number;
}

export default {
  tableName,
  builder: (db: Kysely<unknown>) => {
    return db.schema
      .createTable(tableName)
      .addColumn('entityType', 'integer', (col) => col.notNull())
      .addColumn('entityId', 'text', (col) => col.notNull())
      .addColumn('syncAt', 'integer', (col) => col.notNull())
      .addUniqueConstraint('type-id-unique', ['entityId', 'entityType']);
  },
} as const;
