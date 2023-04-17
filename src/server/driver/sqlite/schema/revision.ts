import { type InferRow, defineSchema } from './type';

const schema = defineSchema({
  tableName: 'revisions',
  fields: {
    id: { increments: true },
    entityType: { type: 'integer', notNullable: true },
    entityId: { type: 'integer', notNullable: true },
    diff: { type: 'text', notNullable: true },
    createdAt: { type: 'integer', notNullable: true, defaultTo: (knex) => knex.raw('(unixepoch())') },
  },
});

export type Row = InferRow<(typeof schema)['fields']>;

export default schema;
