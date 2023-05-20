import { type InferRow, defineSchema } from './type';
import materialSchema from './material';

const schema = defineSchema({
  tableName: 'material_annotations',
  fields: {
    id: { type: 'text', primary: true, notNullable: true },
    materialId: { type: 'text', notNullable: true },
    icon: { type: 'text' },
    comment: { type: 'text' },
    meta: { type: 'text', notNullable: true },
    createdAt: { type: 'integer', notNullable: true, defaultTo: (knex) => knex.raw('(unixepoch())') },
    updatedAt: { type: 'integer', notNullable: true, defaultTo: (knex) => knex.raw('(unixepoch())') },
  },
  restrictions: {
    foreign: {
      materialId: `${materialSchema.tableName}.id`,
    },
  },
});

export type Row = InferRow<(typeof schema)['fields']>;

export default schema;
