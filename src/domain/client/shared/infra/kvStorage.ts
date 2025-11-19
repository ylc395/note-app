import type { Token } from '#utils/singletonContainer';

export interface KvStorage {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
}

export const token: Token<KvStorage> = Symbol('kvStorage');
