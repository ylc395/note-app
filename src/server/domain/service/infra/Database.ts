import type { Knex } from 'knex';

export interface Database {
  init: (dir: string) => Promise<void>;
  knex: Knex;
}

export const token = Symbol('database');
