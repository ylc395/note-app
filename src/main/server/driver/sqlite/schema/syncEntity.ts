import { type InferRow, defineSchema } from './type';

const schema = defineSchema({
  tableName: 'sync_entities',
  fields: {
    entityType: { type: 'integer', notNullable: true },
    entityId: { type: 'text', notNullable: true },
    syncAt: { type: 'integer', notNullable: true },
  },
  restrictions: {
    unique: ['entityType', 'entityId'],
  },
});

export type Row = InferRow<(typeof schema)['fields']>;

export default schema;
