import type { EntityLocator } from 'interface/entity';

export type Conflict = {
  type: 'diff' | 'local-deleted' | 'remote-deleted';
  entity: EntityLocator;
};

export interface Synchronizer {
  putFile: (name: string, content: string) => Promise<void>;
  getFile: (name: string) => Promise<string | null>;
  removeFile: (name: string) => Promise<void>;
  list: () => AsyncGenerator<string>;
  empty: () => Promise<void>;
}

export const CHANNEL = 'synchronizer-log-update';

export interface Log {
  type: 'error' | 'warning' | 'info';
  msg: string;
  timestamp: number;
}
