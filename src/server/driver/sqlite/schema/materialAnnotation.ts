import { type SchemaModule, type Generated, sql } from 'kysely';
import type { AnnotationTypes } from '@domain/model/material.js';
import { tableName as materialsTableName } from './material.js';

export const tableName = 'material_annotations';

export interface Row {
  id: string;
  materialId: string;
  comment: Generated<string>;
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
      .addColumn('comment', 'text', (col) => col.notNull().defaultTo(''))
      .addColumn('type', 'integer', (col) => col.notNull())
      .addColumn('meta', 'text', (col) => col.notNull())
      .addColumn('createdAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch('subsec') * 1000)`))
      .addColumn('updatedAt', 'integer', (col) => col.notNull().defaultTo(sql`(unixepoch('subsec') * 1000)`))
      .addForeignKeyConstraint('materialId-foreign', ['materialId'], materialsTableName, ['id']);
  },
} as const;
