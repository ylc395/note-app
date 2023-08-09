import { type SchemaModule, type Generated, sql } from 'kysely';
import type { EntityTypes } from 'model/entity';

export const tableName = 'revisions';

export interface Row {
  id: string;
  entityType: EntityTypes;
  entityId: string;
  diff: string;
  createdAt: Generated<number>;
}

export default {
  tableName,
  builder: (schema: SchemaModule) => {
    return schema
      .createTable(tableName)
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())
      .addColumn('entityType', 'integer', (col) => col.notNull())
      .addColumn('entityId', 'text', (col) => col.notNull())
      .addColumn('diff', 'text', (col) => col.notNull())
      .addColumn('createdAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch())`));
  },
} as const;
