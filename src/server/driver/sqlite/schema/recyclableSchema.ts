import { type InferRow, defineSchema } from './type';

const schema = defineSchema({
  tableName: 'recyclables',
  fields: {
    type: { type: 'text', notNullable: true, defaultTo: '' },
    entityId: { type: 'integer', notNullable: true },
    deletedAt: { type: 'integer', notNullable: true },
  },
  restrictions: {
    unique: ['type', 'entityId'],
  },
});

export type Row = InferRow<typeof schema['fields']>;

export enum RecyclablesTypes {
  Note = 1,
}

export default schema;
