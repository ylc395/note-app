import { type InferRow, defineSchema } from './type';

const schema = defineSchema({
  tableName: 'revisions',
  fields: {
    id: { type: 'text', primary: true, notNullable: true },
    entityType: { type: 'integer', notNullable: true },
    entityId: { type: 'text', notNullable: true },
    diff: { type: 'text', notNullable: true },
    createdAt: { type: 'integer', notNullable: true, defaultTo: (knex) => knex.raw('(unixepoch())') },
  },
});

export type Row = InferRow<(typeof schema)['fields']>;

export default schema;
