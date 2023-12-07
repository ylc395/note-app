import type Repositories from '@domain/service/repository/index.js';

export interface KvDatabase {
  get(key: string, setter: () => string): Promise<string>;
  get(key: string, setter?: () => string): Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
}

export interface Database {
  transaction: <T>(cb: () => Promise<T>) => Promise<T>;
  getRepository: <T extends keyof Repositories>(name: T) => Repositories[T];
  ready: Promise<void>;
  kv: KvDatabase;
}

export const token = Symbol('database');
