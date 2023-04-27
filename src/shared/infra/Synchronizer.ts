import type { EntityLocator } from 'interface/entity';

export type Conflict = {
  type: 'diff' | 'local-deleted' | 'remote-deleted';
  entity: EntityLocator;
};

export const CHANNEL = 'synchronizer-log-update';

export interface Log {
  type: 'error' | 'warning' | 'info';
  msg: string;
  timestamp: number;
}
