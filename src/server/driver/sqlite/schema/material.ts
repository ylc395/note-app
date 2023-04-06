import { type InferRow, defineSchema } from './type';

export enum MaterialTypes {
  Text = 1,
  File,
  Directory,
}

const schema = defineSchema({
  tableName: 'materials',
  fields: {
    id: { increments: true },
    name: { type: 'text', notNullable: true, defaultTo: '' },
    type: { type: 'integer', notNullable: true },
    parentId: { type: 'integer' },
    sourceUrl: { type: 'text' },
    icon: { type: 'text' },
    createdAt: { type: 'integer', notNullable: true, defaultTo: (knex) => knex.raw('(unixepoch())') },
    updatedAt: { type: 'integer', notNullable: true, defaultTo: (knex) => knex.raw('(unixepoch())') },
  },
});

export type Row = InferRow<(typeof schema)['fields']>;

export default schema;
