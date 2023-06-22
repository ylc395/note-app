import { sql } from 'kysely';
import { type InferRow, defineSchema } from './type';

const schema = defineSchema({
  tableName: 'notes' as const,
  fields: {
    id: { type: 'text', primary: true, notNullable: true },
    title: { type: 'text', notNullable: true, defaultTo: '' },
    body: { type: 'text', notNullable: true, defaultTo: '' },
    parentId: { type: 'text' },
    createdAt: { type: 'integer', notNullable: true, defaultTo: sql`unixepoch()` },
    updatedAt: { type: 'integer', notNullable: true, defaultTo: sql`unixepoch()` },
    isReadonly: { type: 'integer', notNullable: true, defaultTo: 0 },
    icon: { type: 'text' },
    attributes: { type: 'text', notNullable: true, defaultTo: '{}' },
  },
});

export type Row = InferRow<(typeof schema)['fields']>;

export default schema;
