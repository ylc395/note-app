import type { SchemaModule } from 'kysely';
import type { EntityTypes } from 'model/entity';

export const tableName = 'topics';

export interface Row {
  name: EntityTypes;
  entityId: string;
  entityType: EntityTypes;
}

export default {
  tableName,
  builder: (schema: SchemaModule) => {
    return schema
      .createTable(tableName)
      .addColumn('name', 'text', (col) => col.notNull())
      .addColumn('entityId', 'text', (col) => col.notNull())
      .addColumn('entityType', 'integer', (col) => col.notNull())
      .addUniqueConstraint('row-unique', ['name', 'entityId', 'entityType']);
  },
} as const;
