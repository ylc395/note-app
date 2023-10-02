import type { SchemaModule } from 'kysely';
import type { ContentEntityTypes } from 'model/content';

export const tableName = 'topics';

export interface Row {
  name: string;
  entityId: string;
  entityType: ContentEntityTypes;
  position: `${number},${number}` | null;
  createdAt: number;
}

export default {
  tableName,
  builder: (schema: SchemaModule) => {
    return schema
      .createTable(tableName)
      .addColumn('name', 'text', (col) => col.notNull())
      .addColumn('position', 'text')
      .addColumn('entityId', 'text', (col) => col.notNull())
      .addColumn('entityType', 'integer', (col) => col.notNull())
      .addColumn('createdAt', 'integer', (col) => col.notNull());
  },
} as const;
