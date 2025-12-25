import type { ZodType } from 'zod';
import type { Token } from '#utils/singletonContainer';

// 文档型数据库里的数据，类型不是固定的，因此统一置为 unknown，不再在类型定义上费周章
export interface DocumentDb {
  getByKey<T>(storeName: string, key: string, schema: ZodType<T>): Promise<T | null>;
  getByKey<T>(storeName: string, key: string): Promise<T | null>;
  put<T>(storeName: string, record: T): Promise<void>;
}

export const token: Token<DocumentDb> = Symbol('documentDb');
