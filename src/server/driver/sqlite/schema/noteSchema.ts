import type { Knex } from 'knex';

export interface Row {
  id: number;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
  userCreatedAt: number;
  userUpdatedAt: number;
  parentId: number | null;
  json: string;
}

const tableName = 'notes';

const fields = {
  id: { increments: true },
  title: { type: 'text', notNullable: true, defaultTo: '' },
  body: { type: 'text', notNullable: true, defaultTo: '' },
  parentId: { type: 'integer' },
  createdAt: { type: 'integer', notNullable: true, defaultTo: (knex: Knex) => knex.raw('(unixepoch())') },
  updatedAt: { type: 'integer', notNullable: true, defaultTo: (knex: Knex) => knex.raw('(unixepoch())') },
  userCreatedAt: { type: 'integer', notNullable: true, defaultTo: (knex: Knex) => knex.raw('(unixepoch())') },
  userUpdatedAt: { type: 'integer', notNullable: true, defaultTo: (knex: Knex) => knex.raw('(unixepoch())') },
} as const;

const jsonFields = ['isReadonly', 'icon'] as const;

export default {
  tableName,
  fields,
  jsonFields,
};
