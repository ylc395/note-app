import type { Token } from '#utils/singletonContainer';

export interface DocumentDb {
  getByKey(storeName: string, value: unknown): Promise<unknown>;
  put(storeName: string, record: unknown): Promise<void>;
}

export const token: Token<DocumentDb> = Symbol('documentDb');
