import { sql } from 'kysely';
import { type InferRow, defineSchema } from './type';
import materialSchema from './material';

const schema = defineSchema({
  tableName: 'material_annotations' as const,
  fields: {
    id: { type: 'text', primary: true, notNullable: true },
    materialId: { type: 'text', notNullable: true },
    comment: { type: 'text' },
    type: { type: 'integer', notNullable: true },
    meta: { type: 'text', notNullable: true },
    createdAt: { type: 'integer', notNullable: true, defaultTo: sql`(unixepoch())` },
    updatedAt: { type: 'integer', notNullable: true, defaultTo: sql`(unixepoch())` },
  },
  restrictions: {
    foreign: {
      materialId: `${materialSchema.tableName}.id`,
    },
  },
});

export type Row = InferRow<(typeof schema)['fields']>;

export default schema;
