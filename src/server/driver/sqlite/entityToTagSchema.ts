import type { Knex } from 'knex';
import { type Row as TagRow, tableName as tagTableName } from './tagSchema';

export interface Row {
  entityId: number;
  tagId: TagRow['id'];
  createAt: number;
}

export const tableName = 'entity_to_tag';

export default {
  tableName,
  builder: (table: Knex.TableBuilder, knex: Knex) => {
    table.integer('entity_id').notNullable();
    table.integer('tag_id').notNullable();
    table.foreign('tag_id').references(`${tagTableName}.id`);
    table.unique(['tag_id', 'entity_id']);
    table.integer('created_at').defaultTo(knex.raw('(unixepoch())')).notNullable();
  },
};
