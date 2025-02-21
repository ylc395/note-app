import { Type } from 'di-wise';
import type { ZodSchema } from 'zod';

export interface LocalStorage {
  get(key: string): Promise<unknown>;
  get<T>(key: string, schema: ZodSchema<T>): Promise<T | null>;
  getSync(key: string): unknown;
  getSync<T>(key: string, schema: ZodSchema<T>): T | null;

  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
}

export const token = Type<LocalStorage>('localStorage');
