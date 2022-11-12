import type { Knex } from 'knex';

export enum TempFlags {
  No,
  Yes,
}

export interface Row {
  id: number;
  data: ArrayBuffer;
  mimeType: string;
  deviceName: string;
  sourceUrl: string;
  size: number;
  hash: string;
  isTemp: TempFlags;
  textContent: string;
  createdAt: number;
}

export const tableName = 'files';

export default {
  tableName,
  builder: (table: Knex.TableBuilder, knex: Knex) => {
    table.increments('id');
    table.binary('data').notNullable();
    table.text('mime_type').notNullable().defaultTo('');
    table.text('device_name').notNullable().defaultTo('');
    table.text('source_url').notNullable().defaultTo('');
    table.integer('is_temp').notNullable();
    table.text('hash').notNullable();
    table.integer('size').notNullable();
    table.text('text_content').notNullable().defaultTo('');
    table.integer('created_at').notNullable().defaultTo(knex.raw('(unixepoch())'));
  },
};
