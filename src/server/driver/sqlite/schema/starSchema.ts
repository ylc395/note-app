import { type InferRow, defineSchema } from './type';

const schema = defineSchema({
  tableName: 'stars',
  fields: {
    id: { increments: true },
    entityType: { type: 'integer', notNullable: true },
    entityId: { type: 'integer', notNullable: true },
  },
  restrictions: {
    unique: ['entityType', 'entityId'],
  },
});

export type Row = InferRow<(typeof schema)['fields']>;

export default schema;
