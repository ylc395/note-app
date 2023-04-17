import { type InferRow, defineSchema } from './type';

const schema = defineSchema({
  tableName: 'notes',
  fields: {
    id: { type: 'text', primary: true, notNullable: true },
    title: { type: 'text', notNullable: true, defaultTo: '' },
    body: { type: 'text', notNullable: true, defaultTo: '' },
    parentId: { type: 'text' },
    createdAt: { type: 'integer', notNullable: true, defaultTo: (knex) => knex.raw('(unixepoch())') },
    updatedAt: { type: 'integer', notNullable: true, defaultTo: (knex) => knex.raw('(unixepoch())') },
    userCreatedAt: { type: 'integer', notNullable: true, defaultTo: (knex) => knex.raw('(unixepoch())') },
    userUpdatedAt: { type: 'integer', notNullable: true, defaultTo: (knex) => knex.raw('(unixepoch())') },
    isReadonly: { type: 'integer', notNullable: true, defaultTo: 0 },
    icon: { type: 'text' },
    attributes: { type: 'text', notNullable: true, defaultTo: '{}' },
  },
});

export type Row = InferRow<(typeof schema)['fields']>;

export default schema;
