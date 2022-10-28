import type { Knex } from 'knex';

export enum TempFlags {
  No,
  Yes,
}

export interface Row {
  id: number;
  name: string;
  data: ArrayBuffer;
  mimeType: string;
  deviceName: string;
  sourceUrl: string;
  hash: string;
  isTemp: TempFlags;
  ocrResult: string;
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
    table.text('ocr_result').notNullable().defaultTo('');
    table.integer('created_at').notNullable().defaultTo(knex.raw('(unixepoch())'));
  },
};
