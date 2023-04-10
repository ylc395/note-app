import { type InferRow, defineSchema } from './type';
import fileSchema from './file';

const schema = defineSchema({
  tableName: 'materials',
  fields: {
    id: { increments: true },
    name: { type: 'text', notNullable: true, defaultTo: '' },
    fileId: { type: 'integer' },
    parentId: { type: 'integer' },
    sourceUrl: { type: 'text' },
    icon: { type: 'text' },
    createdAt: { type: 'integer', notNullable: true, defaultTo: (knex) => knex.raw('(unixepoch())') },
    updatedAt: { type: 'integer', notNullable: true, defaultTo: (knex) => knex.raw('(unixepoch())') },
  },
  restrictions: {
    foreign: {
      fileId: `${fileSchema.tableName}.id`,
    },
  },
});

export type Row = InferRow<(typeof schema)['fields']>;

export default schema;
