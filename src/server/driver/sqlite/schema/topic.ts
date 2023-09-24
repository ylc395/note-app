import type { SchemaModule } from 'kysely';
import type { EntityTypes } from 'model/entity';

export const tableName = 'topics';

export interface Row {
  name: string;
  entityId: string;
  entityType: EntityTypes;
  position: `${number},${number}`;
  createdAt: number;
}

export default {
  tableName,
  builder: (schema: SchemaModule) => {
    return schema
      .createTable(tableName)
      .addColumn('name', 'text', (col) => col.notNull())
      .addColumn('position', 'text', (col) => col.notNull())
      .addColumn('entityId', 'text', (col) => col.notNull())
      .addColumn('entityType', 'integer', (col) => col.notNull())
      .addColumn('createdAt', 'integer', (col) => col.notNull())
      .addUniqueConstraint('row-unique', ['name', 'entityId', 'entityType', 'position']);
  },
} as const;
