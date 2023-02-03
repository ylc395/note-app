import type { Knex } from 'knex';
import { defineFields, type InferRow } from './type';

const tableName = 'notes';

const fields = defineFields({
  id: { increments: true },
  title: { type: 'text', notNullable: true, defaultTo: '' },
  body: { type: 'text', notNullable: true, defaultTo: '' },
  parentId: { type: 'integer' },
  createdAt: { type: 'integer', notNullable: true, defaultTo: (knex: Knex) => knex.raw('(unixepoch())') },
  updatedAt: { type: 'integer', notNullable: true, defaultTo: (knex: Knex) => knex.raw('(unixepoch())') },
  userCreatedAt: { type: 'integer', notNullable: true, defaultTo: (knex: Knex) => knex.raw('(unixepoch())') },
  userUpdatedAt: { type: 'integer', notNullable: true, defaultTo: (knex: Knex) => knex.raw('(unixepoch())') },
  isReadonly: { type: 'integer', notNullable: true, defaultTo: 0 },
  icon: { type: 'text' },
});

export type Row = InferRow<typeof fields>;

export default {
  tableName,
  fields,
};
