import type { Knex } from 'knex';

interface Fields {
  [k: string]: {
    primary?: true;
    type: 'text' | 'integer' | 'binary';
    notNullable?: true;
    defaultTo?: number | string | ((knex: Knex) => Knex.Value);
    unique?: true;
  };
}

interface Restrictions {
  unique?: string[];
  foreign?: Record<string, string>;
}

export interface Schema {
  tableName: string;
  fields: Fields;
  restrictions?: Restrictions;
}

export type InferRow<T extends Fields> = {
  [k in keyof T]:
    | (T[k]['type'] extends 'integer'
        ? number
        : T[k]['type'] extends 'text'
        ? string
        : T[k]['type'] extends 'blob'
        ? ArrayBuffer
        : unknown)
    | (T[k]['notNullable'] extends true ? never : null);
};

export function defineSchema<T extends Schema>(schema: T) {
  return schema;
}
