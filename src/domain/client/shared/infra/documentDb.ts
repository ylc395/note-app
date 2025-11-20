import type { ZodType } from 'zod';
import type { Token } from '#utils/singletonContainer';

export interface DocumentDb {
  getByKey<T>(storeName: string, value: unknown, schema: ZodType<T>): Promise<T | null>;
  getByKey(storeName: string, value: unknown): Promise<unknown>;
  put<T>(storeName: string, record: T): Promise<void>;
}

export const token: Token<DocumentDb> = Symbol('documentDb');
