import { type InferRow, defineSchema } from './type';

const schema = defineSchema({
  tableName: 'recyclables',
  fields: {
    entityType: { type: 'integer', notNullable: true },
    entityId: { type: 'integer', notNullable: true },
    deletedAt: { type: 'integer', notNullable: true, defaultTo: (knex) => knex.raw('(unixepoch())') },
  },
  restrictions: {
    unique: ['entityType', 'entityId'],
  },
});

export type Row = InferRow<typeof schema['fields']>;

export default schema;
