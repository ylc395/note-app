import type { Token } from '#utils/singletonContainer';

export interface LocalStorage {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
}

export const token: Token<LocalStorage> = Symbol('localStorage');
