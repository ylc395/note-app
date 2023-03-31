import { type InferRow, defineSchema } from './type';

const schema = defineSchema({
  tableName: 'kv',
  fields: {
    key: { type: 'text', notNullable: true },
    value: { type: 'text', notNullable: true },
  },
  restrictions: {
    unique: ['key'],
  },
});

export type Row = InferRow<(typeof schema)['fields']>;

export default schema;
