import { type InferRow, defineSchema } from './type';

const schema = defineSchema({
  tableName: 'files',
  fields: {
    id: { type: 'text', primary: true, notNullable: true },
    data: { type: 'binary', notNullable: true },
    text: { type: 'text' },
    mimeType: { type: 'text', notNullable: true },
    size: { type: 'integer', notNullable: true },
    hash: { type: 'text', notNullable: true },
  },
});

export type Row = InferRow<(typeof schema)['fields']>;

export default schema;
