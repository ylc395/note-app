import type { SchemaModule } from 'kysely';
import type { EntityTypes } from 'model/entity';

export interface Row {
  fromEntityId: string;
  fromEntityType: EntityTypes;
  fromFragmentPosition: `${number},${number}`;
  toEntityId: string;
  toEntityType: EntityTypes;
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
      .addColumn('fromFragmentPosition', 'text', (col) => col.notNull())
      .addColumn('toEntityType', 'integer', (col) => col.notNull())
      .addColumn('toEntityId', 'text', (col) => col.notNull())
      .addColumn('toFragmentId', 'text', (col) => col.notNull());
  },
} as const;
