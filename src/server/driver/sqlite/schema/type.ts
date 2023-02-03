import type { Knex } from 'knex';

export type Fields = Readonly<
  Record<
    string,
    {
      increments?: true;
      type?: 'text' | 'integer';
      notNullable?: true;
      defaultTo?: number | string | ((knex: Knex) => Knex.Value);
    }
  >
>;

export interface Schema {
  tableName: string;
  fields: Fields;
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

export function defineFields<T extends Fields>(fields: T) {
  return fields;
}
