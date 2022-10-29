import type { Knex } from 'knex';

export enum TagTypes {
  Material = 1,
}

export interface Row {
  id: number;
  name: string;
  parentId: number;
  type: TagTypes;
  createAt: number;
  updatedAt: number;
}

export const tableName = 'tags';

export default {
  tableName,
  builder: (table: Knex.TableBuilder, knex: Knex) => {
    table.increments('id');
    table.text('name').notNullable();
    table.integer('type').notNullable();
    table.integer('parent_id').notNullable().defaultTo(0);
    table.unique(['name', 'type']);
    table.integer('created_at').defaultTo(knex.raw('(unixepoch())')).notNullable();
    table.integer('updated_at').defaultTo(knex.raw('(unixepoch())')).notNullable();
  },
};
