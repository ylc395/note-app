import type { Knex } from 'knex';
import { tableName as filesTableName } from './fileSchema';

export interface Row {
  id: number;
  name: string;
  fileId: number;
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
    table.integer('file_id').notNullable();
    table.foreign('file_id').references(`${filesTableName}.id`);
    table.text('comment').notNullable().defaultTo('');
    table.integer('rating').notNullable().defaultTo(0);
    table.integer('created_at').defaultTo(knex.raw('(unixepoch())')).notNullable();
    table.integer('updated_at').defaultTo(knex.raw('(unixepoch())')).notNullable();
  },
};
