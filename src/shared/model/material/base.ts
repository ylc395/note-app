import type { EntityId, EntityParentId } from '../entity';

interface BaseMaterial {
  id: EntityId;
  name: string;
  icon: string | null;
  parentId: EntityParentId;
  createdAt: number;
  userUpdatedAt: number;
  updatedAt: number;
}

export interface MaterialDirectory extends BaseMaterial {}

export interface MaterialEntity extends BaseMaterial {
  mimeType: string;
  sourceUrl: string | null;
}

export type Material = MaterialDirectory | MaterialEntity;

export enum MaterialTypes {
  Directory = 1,
  Entity,
}
