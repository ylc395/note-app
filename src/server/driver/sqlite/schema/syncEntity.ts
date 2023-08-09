import type { SchemaModule } from 'kysely';
import type { EntityTypes } from 'model/entity';

export const tableName = 'sync_entities';

export interface Row {
  entityType: EntityTypes;
  entityId: string;
  syncAt: number;
}

export default {
  tableName,
  builder: (schema: SchemaModule) => {
    return schema
      .createTable(tableName)
      .addColumn('entityType', 'integer', (col) => col.notNull())
      .addColumn('entityId', 'text', (col) => col.notNull())
      .addColumn('syncAt', 'integer', (col) => col.notNull())
      .addUniqueConstraint('type-id-unique', ['entityId', 'entityType']);
  },
} as const;
