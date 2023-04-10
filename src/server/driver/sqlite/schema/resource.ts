import { type InferRow, defineSchema } from './type';
import fileSchema from './file';

const schema = defineSchema({
  tableName: 'resources',
  fields: {
    id: { increments: true },
    name: { type: 'text', notNullable: true },
    sourceUrl: { type: 'text' },
    createdAt: { type: 'integer', notNullable: true, defaultTo: (knex) => knex.raw('(unixepoch())') },
    fileId: { type: 'integer', notNullable: true },
  },
  restrictions: {
    foreign: {
      fileId: `${fileSchema.tableName}.id`,
    },
  },
});

export type Row = InferRow<(typeof schema)['fields']>;

export default schema;
