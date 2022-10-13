import type { Knex } from 'knex';

export default {
  tableName: 'materials',
  builder: (table: Knex.TableBuilder) => {
    table.increments('id');
    table.binary('file');
    table.text('name');
    table.text('source');
    table.timestamp('added_at');
  },
};
