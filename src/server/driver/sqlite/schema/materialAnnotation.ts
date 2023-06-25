import { type SchemaModule, type Generated, sql } from 'kysely';
import type { AnnotationTypes } from 'interface/material';
import { tableName as materialsTableName } from './material';

export const tableName = 'material_annotations';

export interface Row {
  id: string;
  materialId: string;
  comment: string | null;
  type: AnnotationTypes;
  meta: string;
  createdAt: Generated<number>;
  updatedAt: Generated<number>;
}

export default {
  tableName,
  builder: (schema: SchemaModule) => {
    return schema
      .createTable(tableName)
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())
      .addColumn('materialId', 'text', (col) => col.notNull())
      .addColumn('comment', 'text')
      .addColumn('type', 'integer', (col) => col.notNull())
      .addColumn('meta', 'text', (col) => col.notNull())
      .addColumn('createdAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch())`))
      .addColumn('updatedAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch())`))
      .addForeignKeyConstraint('materialId-foreign', ['materialId'], materialsTableName, ['id']);
  },
} as const;
