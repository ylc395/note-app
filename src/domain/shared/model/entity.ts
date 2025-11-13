import type { FileVO } from './file.js';

export enum EntityTypes {
  Note = 1,
  Memo,
  Annotation,
}

export type EntityId = string;

export type EntityParentId = EntityId | null;

export interface Icon {
  type: 'emoji' | 'file';
  code: string;
}

export interface Entity {
  id: EntityId;
  type: EntityTypes;
  title: string; // 对于 memo / annotation，取其内容的前 30 个字符
  bodyPreview?: string;
  icon: Icon | null;
  file?: FileVO;
  path?: EntityPath;
  createdAt: number;
  updatedAt: number;
}

export type EntityPath = Array<Pick<Entity, 'id' | 'title' | 'icon'>>;
