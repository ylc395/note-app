import type { Knex } from 'knex';

export enum Types {
  Material,
  Note,
}

export interface Row {
  id: number;
  name: string;
  type: Types;
  parentId: number;
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
    table.integer('created_at').defaultTo(knex.raw('(unixepoch())')).notNullable();
    table.integer('updated_at').defaultTo(knex.raw('(unixepoch())')).notNullable();
  },
};
