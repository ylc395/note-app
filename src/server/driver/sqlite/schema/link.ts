import type { Kysely } from 'kysely';
import type { ContentEntityTypes } from '@domain/model/content.js';
import type { EntityTypes } from '@domain/model/entity.js';

export interface Row {
  fromEntityId: string;
  fromEntityType: ContentEntityTypes;
  fromPosition: `${number},${number}`;
  toEntityId: string;
  toEntityType: EntityTypes;
  toFragmentId: string;
  createdAt: number;
}

export const tableName = 'links';

export default {
  tableName,
  builder: (db: Kysely<unknown>) => {
    return db.schema
      .createTable(tableName)
      .addColumn('fromEntityType', 'integer', (col) => col.notNull())
      .addColumn('fromEntityId', 'text', (col) => col.notNull())
      .addColumn('fromPosition', 'text', (col) => col.notNull())
      .addColumn('toEntityType', 'integer', (col) => col.notNull())
      .addColumn('toEntityId', 'text', (col) => col.notNull())
      .addColumn('toFragmentId', 'text', (col) => col.notNull())
      .addColumn('createdAt', 'integer', (col) => col.notNull());
  },
} as const;
