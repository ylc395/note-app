import type { Knex } from 'knex';

export interface Row {
  id: number;
  name: string;
  entityId: number;
  comment: string;
  rating: number;
  createdAt: number;
  updatedAt: number;
}

export const tableName = 'materials';

export default {
  tableName,
  builder: (table: Knex.TableBuilder, knex: Knex) => {
    table.increments('id');
    table.text('name').notNullable();
    table.integer('entity_id').notNullable();
    table.text('comment').notNullable().defaultTo('');
    table.integer('rating').notNullable().defaultTo(0);
    table.integer('created_at').defaultTo(knex.raw('(unixepoch())')).notNullable();
    table.integer('updated_at').defaultTo(knex.raw('(unixepoch())')).notNullable();
  },
};
