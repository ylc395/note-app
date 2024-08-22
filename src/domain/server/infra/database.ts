import type { InjectionToken } from 'tsyringe';

export interface Database {
  transaction: <T>(cb: () => Promise<T>) => Promise<T>;
  ready: Promise<void>;
}

export const token: InjectionToken<Database> = Symbol('database');
