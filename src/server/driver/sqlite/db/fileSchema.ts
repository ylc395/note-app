import type { Knex } from 'knex';

export interface Row {
  id: number;
  name: string;
  data: ArrayBuffer;
  mimeType: string;
  deviceName: string;
  sourceUrl: string;
  hash: string;
  createdAt: number;
}

export default {
  tableName: 'files',
  builder: (table: Knex.TableBuilder, knex: Knex) => {
    table.increments('id');
    table.text('name').notNullable();
    table.binary('data').notNullable();
    table.text('mime_type').notNullable().defaultTo('');
    table.text('device_name').notNullable().defaultTo('');
    table.text('source_url').notNullable().defaultTo('');
    table.text('hash').notNullable();
    table.integer('created_at').defaultTo(knex.raw('(unixepoch())')).notNullable();
  },
};
