import { sql } from 'kysely';
import { type InferRow, defineSchema } from './type';

const schema = defineSchema({
  tableName: 'recyclables' as const,
  fields: {
    entityType: { type: 'integer', notNullable: true },
    entityId: { type: 'text', notNullable: true },
    isHard: { type: 'integer', notNullable: true, defaultTo: 0 },
    deletedAt: { type: 'integer', notNullable: true, defaultTo: sql`(unixepoch())` },
  },
  restrictions: {
    unique: ['entityType', 'entityId'],
  },
});

export type Row = InferRow<(typeof schema)['fields']>;

export default schema;
