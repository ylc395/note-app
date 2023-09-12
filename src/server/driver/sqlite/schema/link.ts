import type { SchemaModule } from 'kysely';
import type { EntityTypes } from 'model/entity';

export interface Row {
  fromEntityId: string;
  fromEntityType: EntityTypes;
  fromFragmentId: string;
  toEntityId: string;
  toEntityTypes: EntityTypes;
  toFragmentId: string;
}

export const tableName = 'links';

export default {
  tableName,
  builder: (schema: SchemaModule) => {
    return schema
      .createTable(tableName)
      .addColumn('fromEntityType', 'integer', (col) => col.notNull())
      .addColumn('fromEntityId', 'text', (col) => col.notNull())
      .addColumn('fromFragmentId', 'text', (col) => col.notNull())
      .addColumn('toEntityType', 'integer', (col) => col.notNull())
      .addColumn('toEntityId', 'text', (col) => col.notNull())
      .addColumn('toFragmentId', 'text', (col) => col.notNull());
  },
} as const;
