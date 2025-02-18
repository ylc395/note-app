import { Type } from 'di-wise';
import type { ZodSchema } from 'zod';

export interface LocalStorage {
  get(key: string): unknown;
  get<T>(key: string, schema: ZodSchema<T>): T | null;
  set(key: string, value: unknown): void;
  delete(key: string): void;
}

export const token = Type<LocalStorage>('localStorage');
