import { type InferRow, defineSchema } from './type';

const schema = defineSchema({
  tableName: 'stars' as const,
  fields: {
    id: { type: 'text', primary: true, notNullable: true },
    entityType: { type: 'integer', notNullable: true },
    entityId: { type: 'text', notNullable: true },
  },
  restrictions: {
    unique: ['entityType', 'entityId'],
  },
});

export type Row = InferRow<(typeof schema)['fields']>;

export default schema;
