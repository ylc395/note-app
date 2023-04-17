import { type InferRow, defineSchema } from './type';
import fileSchema from './file';

const schema = defineSchema({
  tableName: 'materials',
  fields: {
    id: { type: 'text', primary: true, notNullable: true },
    name: { type: 'text', notNullable: true, defaultTo: '' },
    fileId: { type: 'text' },
    parentId: { type: 'text' },
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
