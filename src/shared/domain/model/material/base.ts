import type { EntityId, EntityParentId } from '../entity.js';

interface BaseMaterial {
  id: EntityId;
  title: string;
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
