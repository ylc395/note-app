import type { Token } from '#utils/singletonContainer';
import type { ZodType } from 'zod';

// kv数据库里的数据，类型不是固定的，因此统一置为 unknown，不再在类型定义上费周章
export interface KvStorage {
  get<T>(key: string, schema: ZodType<T>): Promise<T | null>;
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
}

export const token: Token<KvStorage> = Symbol('kvStorage');
