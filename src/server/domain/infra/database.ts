import type { InjectionToken } from 'tsyringe';
import type Repositories from '@domain/service/repository/index.js';

export interface Database {
  transaction: <T>(cb: () => Promise<T>) => Promise<T>;
  getRepository: <T extends keyof Repositories>(name: T) => Repositories[T];
  ready: Promise<void>;
}

export const token: InjectionToken<Database> = Symbol('database');
