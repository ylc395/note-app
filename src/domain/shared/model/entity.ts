import type { FileVO } from './file.js';

export enum EntityTypes {
  Note = 1,
  Memo,
  Material,
  Annotation,
}

export type EntityId = string;

export type EntityParentId = EntityId | null;

interface StandaloneEntity {
  id: EntityId;
  type: EntityTypes;
  title: string;
  body?: string;
  icon: string | null;
  file?: FileVO;
  createdAt: number;
  updatedAt: number;
}

export interface Entity extends StandaloneEntity {
  main?: StandaloneEntity; // Example: the material of an annotation;
}

export type EntityPath = Array<Pick<Entity, 'id' | 'title' | 'icon'>>;
