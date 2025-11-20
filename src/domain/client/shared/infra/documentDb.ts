import type { ZodType } from 'zod';
import type { Token } from '#utils/singletonContainer';

// 文档型数据库里的数据，类型不是固定的，因此统一置为 unknown，不再在类型定义上费周章
// 相关论述可见 https://www.kimi.com/share/19aa128e-5d02-882f-8000-000067375538
export interface DocumentDb {
  getByKey<T>(storeName: string, value: unknown, schema: ZodType<T>): Promise<T | null>;
  getByKey(storeName: string, value: unknown): Promise<unknown>;
  put<T>(storeName: string, record: T): Promise<void>;
}

export const token: Token<DocumentDb> = Symbol('documentDb');
