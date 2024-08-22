import type { Generated, Kysely } from 'kysely';
import { tableName as filesTableName } from './file.js';

export const tableName = 'materials';

export interface Row {
  id: string;
  title: string;
  fileId: string | null;
  parentId: string | null;
  sourceUrl: string | null;
  icon: string | null;
  comment: Generated<string>;
  createdAt: number;
  updatedAt: number;
}

export default {
  tableName,
  builder: (db: Kysely<unknown>) => {
    return db.schema
      .createTable(tableName)
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())
      .addColumn('title', 'text', (col) => col.notNull())
      .addColumn('fileId', 'text')
      .addColumn('parentId', 'text')
      .addColumn('sourceUrl', 'text')
      .addColumn('comment', 'text', (col) => col.notNull().defaultTo(''))
      .addColumn('icon', 'text')
      .addColumn('createdAt', 'integer', (col) => col.notNull())
      .addColumn('updatedAt', 'integer', (col) => col.notNull())
      .addForeignKeyConstraint('fileId-foreign', ['fileId'], filesTableName, ['id']);
  },
} as const;
