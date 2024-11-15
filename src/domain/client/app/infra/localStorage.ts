import { Type } from 'di-wise';

export interface LocalStorage {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
}

export const token = Type<LocalStorage>('localStorage');
