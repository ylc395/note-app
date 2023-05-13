import type Repositories from 'service/repository';

export interface TransactionManager<T> {
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
  start: () => Promise<T>; // create or reuse a transaction
  run: <R>(connection: T, cb: () => R) => R;
}

export interface DbConfig {
  dir?: string;
}

export interface Database {
  transactionManager: TransactionManager<unknown>;
  getRepository: <T extends keyof Repositories>(name: T) => Repositories[T];
  init: (config: DbConfig) => Promise<void>;
}

export const token = Symbol('database');
