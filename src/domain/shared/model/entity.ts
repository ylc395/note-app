import type { FileVO } from './file.js';

export enum EntityTypes {
  Note = 1,
  Memo,
  Annotation,
}

export type EntityId = string;

export type EntityParentId = EntityId | null;

interface StandaloneEntity {
  id: EntityId;
  type: EntityTypes;
  title: string; // 对于 memo / annotation，取其内容的前 30 个字符
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
