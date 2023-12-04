import { type SchemaModule, type Generated, sql } from 'kysely';
import type { RecyclableEntityTypes } from '@domain/model/recyclables';

export const tableName = 'recyclables';

export interface Row {
  entityId: string;
  entityType: RecyclableEntityTypes;
  reason: number;
  isHard: Generated<0 | 1>;
  deletedAt: number;
}

export default {
  tableName,
  builder: (schema: SchemaModule) => {
    return schema
      .createTable(tableName)
      .addColumn('entityId', 'text', (col) => col.notNull())
      .addColumn('entityType', 'integer', (col) => col.notNull())
      .addColumn('isHard', 'integer', (col) => col.notNull().defaultTo(0))
      .addColumn('reason', 'integer', (col) => col.notNull())
      .addColumn('deletedAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch('subsec') * 1000)`))
      .addUniqueConstraint('id-type-unique', ['entityId', 'entityType']);
  },
} as const;
