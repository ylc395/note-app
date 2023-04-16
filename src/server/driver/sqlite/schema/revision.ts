import { type InferRow, defineSchema } from './type';

const schema = defineSchema({
  tableName: 'revisions',
  fields: {
    id: { increments: true },
    entityType: { type: 'integer', notNullable: true },
    entityId: { type: 'integer', notNullable: true },
    diff: { type: 'text', notNullable: true },
  },
});

export type Row = InferRow<(typeof schema)['fields']>;

export default schema;
