import { Type } from 'di-wise';

export interface Database {
  transaction: <T>(cb: () => Promise<T>) => Promise<T>;
  ready: Promise<void>;
}

export const token = Type<Database>('database');
