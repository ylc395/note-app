import type { EntityId } from './entity';

export interface RevisionVO {
  id: EntityId;
  createdAt: number;
  diff: string;
}
