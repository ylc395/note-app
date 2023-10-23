import type { Starable } from '../star';
import type { MaterialDirectory, MaterialEntity } from './base';

export interface MaterialDirectoryVO extends Omit<MaterialDirectory, 'userUpdatedAt'>, Starable {
  childrenCount: number;
}

export interface MaterialEntityVO extends Omit<MaterialEntity, 'userUpdatedAt'>, Starable {}

export type MaterialVO = MaterialDirectoryVO | MaterialEntityVO;

export type MaterialCommentVO = string;

export const isDirectory = (entity: MaterialVO): entity is MaterialDirectoryVO => {
  return 'childrenCount' in entity;
};

export const isEntityMaterial = (entity: MaterialVO): entity is MaterialEntityVO => {
  return 'mimeType' in entity;
};
