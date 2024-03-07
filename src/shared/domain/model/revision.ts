import type { EntityId } from './entity.js';

export interface Revision {
  createdAt: number;
  entityId: EntityId;
  device: string;
  diff: string;
}

export type RevisionVO = Pick<Revision, 'createdAt' | 'diff'>;
