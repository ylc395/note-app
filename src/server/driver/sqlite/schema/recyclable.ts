import type { EntityTypes } from 'interface/entity';
import { type SchemaModule, type Generated, sql } from 'kysely';

export const tableName = 'recyclables';

export interface Row {
  entityId: string;
  entityType: EntityTypes;
  isHard: Generated<0 | 1>;
  deletedAt: Generated<number>;
}

export default {
  tableName,
  builder: (schema: SchemaModule) => {
    return schema
      .createTable(tableName)
      .addColumn('entityId', 'text', (col) => col.notNull())
      .addColumn('entityType', 'integer', (col) => col.notNull())
      .addColumn('isHard', 'integer', (col) => col.notNull().defaultTo(0))
      .addColumn('deletedAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch())`));
  },
} as const;
