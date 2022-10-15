import type { Knex } from 'knex';

export default {
  tableName: 'materials',
  builder: (table: Knex.TableBuilder) => {
    table.increments('id');
    table.binary('data');
    table.text('name');
    table.text('source');
    table.text('mime_type');
    table.timestamp('added_at');
  },
};
