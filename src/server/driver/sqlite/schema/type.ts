import type { Knex } from 'knex';

interface Fields {
  [k: string]: {
    increments?: true;
    type?: 'text' | 'integer';
    notNullable?: true;
    defaultTo?: number | string | ((knex: Knex) => Knex.Value);
  };
}

interface Restrictions {
  unique?: string[];
}

export interface Schema {
  tableName: string;
  fields: Fields;
  restrictions?: Restrictions;
}

export type InferRow<T extends Fields> = {
  [k in keyof T]:
    | (T[k]['increments'] extends true
        ? number
        : T[k]['type'] extends 'integer'
        ? number
        : T[k]['type'] extends 'text'
        ? string
        : unknown)
    | (T[k]['notNullable'] extends true ? never : T[k]['increments'] extends true ? never : null);
};

export function defineSchema<T extends Schema>(schema: T) {
  return schema;
}
