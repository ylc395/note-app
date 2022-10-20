import type { Knex } from 'knex';

export default {
  tableName: 'files',
  builder: (table: Knex.TableBuilder, knex: Knex) => {
    table.increments('id');
    table.text('name').notNullable();
    table.binary('data').notNullable();
    table.text('mime_type').notNullable();
    table.text('device_name').notNullable();
    table.text('source_url').notNullable();
    table.text('hash').notNullable();
    table.integer('created_at').defaultTo(knex.fn.now()).notNullable();
  },
};
