import type { Token } from '#utils/singletonContainer';

export interface Database {
  transaction: <T>(cb: () => Promise<T>) => Promise<T>;
  ready: Promise<void>;
}

export const token: Token<Database> = Symbol('database');
