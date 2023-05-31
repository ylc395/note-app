import type { EntityLocator } from 'interface/entity';

export interface SyncTarget {
  putFile: (name: string, content: string) => Promise<void>;
  getFile: (name: string) => Promise<string | null>;
  removeFile: (name: string) => Promise<void>;
  list: () => AsyncGenerator<string>;
  empty: () => Promise<void>;
}

export interface Log {
  type: 'error' | 'warning' | 'info';
  msg: string;
  timestamp: number;
}

export type Conflict = {
  type: 'diff' | 'local-deleted' | 'remote-deleted';
  entity: EntityLocator;
};

export type SyncTargetFactory = (target: 'fs' | 'webdav') => SyncTarget;

export const token = Symbol();
