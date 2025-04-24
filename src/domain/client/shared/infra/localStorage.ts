import type { ZodSchema } from 'zod';
import type { Token } from '#utils/singletonContainer';

export interface LocalStorage {
  get(key: string): Promise<unknown>;
  get<T>(key: string, schema: ZodSchema<T>): Promise<T | null>;
  getSync(key: string): unknown;
  getSync<T>(key: string, schema: ZodSchema<T>): T | null;

  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
}

export const token: Token<LocalStorage> = Symbol('localStorage');
