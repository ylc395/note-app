import { type InferRow, defineSchema } from './type';

const schema = defineSchema({
  tableName: 'memos',
  fields: {
    id: { increments: true },
    content: { type: 'text', notNullable: true },
    parentId: { type: 'integer' },
    isPinned: { type: 'integer', notNullable: true, defaultTo: 0 },
    createdAt: { type: 'integer', notNullable: true, defaultTo: (knex) => knex.raw('(unixepoch())') },
    updatedAt: { type: 'integer', notNullable: true, defaultTo: (knex) => knex.raw('(unixepoch())') },
  },
});

export type Row = InferRow<(typeof schema)['fields']>;

export default schema;
