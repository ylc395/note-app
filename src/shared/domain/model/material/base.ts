import type { EntityId, EntityParentId } from '../entity.js';

export interface Material {
  id: EntityId;
  title: string;
  icon: string | null;
  parentId: EntityParentId;
  createdAt: number;
  userUpdatedAt: number;
  updatedAt: number;
}

export interface EntityMaterial extends Material {
  mimeType: string;
  comment: string;
  sourceUrl: string | null;
}

export enum MaterialTypes {
  Directory = 1,
  Entity,
}
