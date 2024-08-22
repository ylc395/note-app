import type { FileVO } from './file.js';

export enum EntityTypes {
  Note = 1,
  Memo,
  Material,
  Annotation,
}

export type EntityId = string;

export type EntityParentId = EntityId | null;

export interface EntityLocator {
  entityId: EntityId;
  entityType: EntityTypes;
}

export type EntityPath = Array<{
  id: EntityId;
  title: string;
  icon: string | null;
}>;

interface StandaloneEntity {
  id: EntityId;
  type: EntityTypes;
  title: string;
  icon: string | null;
  file?: FileVO;
  body?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Entity extends StandaloneEntity {
  main?: StandaloneEntity; // Example: the material of an annotation;
}
