import type { EntityId } from './entity';

export enum RevisionTypes {
  Regular = 1,
  BigChange,
}

export interface RevisionVO {
  id: EntityId;
  createdAt: number;
  type?: RevisionTypes;
}
