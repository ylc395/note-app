export interface KvDatabase {
  get(key: string, setter: () => string): Promise<string>;
  get(key: string, setter?: () => string): Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  init: () => Promise<void>;
}

export const token = Symbol();
