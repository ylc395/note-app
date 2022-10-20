import type { Knex } from 'knex';
import fileSchema from './fileSchema';

export default {
  tableName: 'materials',
  builder: (table: Knex.TableBuilder, knex: Knex) => {
    table.increments('id');
    table.text('name').notNullable();
    table.integer('file_id').notNullable();
    table.foreign('file_id').references(`${fileSchema.tableName}.id`);
    table.text('comment').notNullable().defaultTo('');
    table.integer('rating').notNullable().defaultTo(0);
    table.integer('created_at').defaultTo(knex.fn.now()).notNullable();
    table.integer('updated_at').defaultTo(knex.fn.now()).notNullable();
  },
};
