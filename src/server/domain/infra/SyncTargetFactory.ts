export interface SyncTarget {
  putFile: (name: string, content: string) => Promise<void>;
  getFile: (name: string) => Promise<string | null>;
  removeFile: (name: string) => Promise<void>;
  list: () => AsyncGenerator<string>;
  empty: () => Promise<void>;
}

export type SyncTargetFactory = (target: 'fs' | 'webdav') => SyncTarget;

export const token = Symbol();
