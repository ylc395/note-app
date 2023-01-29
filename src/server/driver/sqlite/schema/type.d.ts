import type { Knex } from 'knex';

export type Fields = Record<
  string,
  {
    increments?: true;
    type?: 'text' | 'integer';
    notNullable?: true;
    defaultTo?: string | ((knex: Knex) => Knex.Value);
  }
>;

export interface Schema {
  tableName: string;
  fields: Fields;
  jsonFields: Readonly<string[]>;
}
