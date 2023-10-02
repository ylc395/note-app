import type { SchemaModule } from 'kysely';
import type { StarEntityTypes } from 'model/star';

export const tableName = 'stars';

export interface Row {
  id: string;
  entityType: StarEntityTypes;
  entityId: string;
}

export default {
  tableName,
  builder: (schema: SchemaModule) => {
    return schema
      .createTable(tableName)
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())

      .addColumn('entityType', 'integer', (col) => col.notNull())
      .addColumn('entityId', 'text', (col) => col.notNull())
      .addUniqueConstraint('type-id-unique', ['entityId', 'entityType']);
  },
} as const;
