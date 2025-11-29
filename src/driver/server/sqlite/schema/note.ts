import type { JSONColumnType, Kysely, Generated } from 'kysely';
import type { EntityTypes, Icon } from '#domain/shared/model/entity';

export const tableName = 'notes';

export interface Row {
  id: string;
  type: EntityTypes;
  icon: JSONColumnType<Icon> | null;
  title: Generated<string>;
  body: Generated<string>;
  bodyPlainText: string;
  sourceUrl: string | null;
  parentId: string | null;
  fileId: string | null;
  details: JSONColumnType<Record<string, unknown>> | null;
  createdAt: number;
  updatedAt: number;
}

export default {
  tableName,
  builder: (db: Kysely<unknown>) => {
    return db.schema
      .createTable(tableName)
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())
      .addColumn('type', 'integer', (col) => col.notNull())
      .addColumn('title', 'text', (col) => col.notNull().defaultTo(''))
      .addColumn('body', 'text', (col) => col.notNull().defaultTo(''))
      .addColumn('bodyPlainText', 'text', (col) => col.notNull())
      .addColumn('sourceUrl', 'text')
      .addColumn('fileId', 'text')
      .addColumn('icon', 'text')
      .addColumn('parentId', 'text')
      .addColumn('details', 'text')
      .addColumn('createdAt', 'integer', (col) => col.notNull())
      .addColumn('updatedAt', 'integer', (col) => col.notNull());
  },
} as const;
