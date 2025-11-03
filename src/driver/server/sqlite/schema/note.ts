import type { Icon } from '#domain/shared/model/entity';
import type { JSONColumnType, Kysely } from 'kysely';

export const tableName = 'notes';

export interface Row {
  id: string;
  icon: JSONColumnType<Icon> | null;
  title: string;
  body: string;
  bodyPlainText: string;
  sourceUrl: string | null;
  parentId: string | null;
  fileId: string | null;
  createdAt: number;
  updatedAt: number;
}

export default {
  tableName,
  builder: (db: Kysely<unknown>) => {
    return db.schema
      .createTable(tableName)
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())
      .addColumn('title', 'text', (col) => col.notNull().defaultTo(''))
      .addColumn('body', 'text', (col) => col.notNull().defaultTo(''))
      .addColumn('bodyPlainText', 'text', (col) => col.notNull().defaultTo(''))
      .addColumn('sourceUrl', 'text')
      .addColumn('fileId', 'text')
      .addColumn('icon', 'text')
      .addColumn('parentId', 'text')
      .addColumn('createdAt', 'integer', (col) => col.notNull())
      .addColumn('updatedAt', 'integer', (col) => col.notNull());
  },
} as const;
