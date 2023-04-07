import { type InferRow, defineSchema } from './type';
import fileDataSchema from './file';

const schema = defineSchema({
  tableName: 'resources',
  fields: {
    id: { increments: true },
    name: { type: 'text', notNullable: true },
    sourceUrl: { type: 'text' },
    createdAt: { type: 'integer', notNullable: true, defaultTo: (knex) => knex.raw('(unixepoch())') },
    fileDataId: { type: 'integer', notNullable: true },
  },
  restrictions: {
    foreign: {
      fileDataId: `${fileDataSchema.tableName}.id`,
    },
  },
});

export type Row = InferRow<(typeof schema)['fields']>;

export default schema;
