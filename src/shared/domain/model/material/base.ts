import dayjs from 'dayjs';
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
  comment: string;
  sourceUrl: string | null;
}

export type Material = MaterialDirectory | MaterialEntity;

export enum MaterialTypes {
  Directory = 1,
  Entity,
}
export const isEntityMaterial = (entity: Material): entity is MaterialEntity => {
  return 'mimeType' in entity;
};

export const isDirectory = (entity: Material): entity is MaterialDirectory => {
  return !isEntityMaterial(entity);
};

export function normalizeTitle(v: Pick<Material, 'createdAt' | 'title'>) {
  return (
    v.title || `未命名${isEntityMaterial(v as any) ? '素材' : '目录'}${dayjs(v.createdAt).format('YYYYMMDD-HHmm')}`
  );
}
