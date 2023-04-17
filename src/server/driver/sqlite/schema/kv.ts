import { type InferRow, defineSchema } from './type';

const schema = defineSchema({
  tableName: 'kv',
  fields: {
    key: { type: 'text', notNullable: true, unique: true },
    value: { type: 'text', notNullable: true },
  },
});

export type Row = InferRow<(typeof schema)['fields']>;

export default schema;
