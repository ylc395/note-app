import { sql } from 'kysely';
import { type InferRow, defineSchema } from './type';

const schema = defineSchema({
  tableName: 'memos' as const,
  fields: {
    id: { type: 'text', primary: true, notNullable: true },
    content: { type: 'text', notNullable: true },
    parentId: { type: 'text' },
    isPinned: { type: 'integer', notNullable: true, defaultTo: 0 },
    createdAt: { type: 'integer', notNullable: true, defaultTo: sql`(unixepoch())` },
    updatedAt: { type: 'integer', notNullable: true, defaultTo: sql`(unixepoch())` },
  },
});

export type Row = InferRow<(typeof schema)['fields']>;

export default schema;
