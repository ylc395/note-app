import { getDb } from './index';

export const kvSchema = {
  tableName: 'kv',
  fields: {
    key: { type: 'text', notNullable: true, unique: true },
    value: { type: 'text', notNullable: true },
  },
} as const;

export interface KvRow {
  key: string;
  value: string;
}

export function load(key: string): Promise<string | null>;
export function load(key: string, value: () => string): Promise<string>;
export async function load(key: string, value?: () => string) {
  const knex = await getDb();
  const row = await knex<KvRow>(kvSchema.tableName).where('key', key).first();

  if (row) {
    return row.value;
  } else if (!value) {
    return null;
  }

  const v = value();
  await knex<KvRow>(kvSchema.tableName).insert({ value: v, key });
  return v;
}

export async function set(key: string, value: string) {
  const knex = await getDb();
  const count = await knex<KvRow>(kvSchema.tableName).update({ value }).where('key', key);

  if (count === 0) {
    await knex<KvRow>(kvSchema.tableName).insert({ key, value });
  }
}
