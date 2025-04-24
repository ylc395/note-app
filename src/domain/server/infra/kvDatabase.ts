import type { Token } from '#utils/singletonContainer';

export interface KvDatabase {
  ready: Promise<void>;
  get(key: string, setter: () => string): Promise<string>;
  get(key: string, setter?: () => string): Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
}

export const token: Token<KvDatabase> = Symbol('KvDatabase');
