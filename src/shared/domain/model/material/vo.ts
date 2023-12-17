import { Path } from '../entity.js';
import type { Starable } from '../star.js';
import type { MaterialDirectory, MaterialEntity } from './base.js';

export interface MaterialDirectoryVO extends Omit<MaterialDirectory, 'userUpdatedAt'> {
  childrenCount: number;
}

export interface MaterialEntityVO extends Omit<MaterialEntity, 'userUpdatedAt'>, Starable {
  path?: Path;
}

export type MaterialVO = MaterialDirectoryVO | MaterialEntityVO;

export const isEntityMaterialVO = (entity: MaterialVO): entity is MaterialEntityVO => {
  return 'mimeType' in entity;
};

export const isDirectoryVO = (entity: MaterialVO): entity is MaterialDirectoryVO => {
  return !isEntityMaterialVO(entity);
};
