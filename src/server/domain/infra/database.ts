import type Repositories from 'service/repository';

export interface Database {
  transaction: <T>(cb: () => Promise<T>) => Promise<T>;
  getRepository: <T extends keyof Repositories>(name: T) => Repositories[T];
  ready: Promise<void>;
}

export const token = Symbol('database');
