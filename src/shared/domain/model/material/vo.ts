import type { Path } from '../entity.js';
import type { Material } from './base.js';

export interface MaterialVO extends Omit<Material, 'userUpdatedAt'> {
  childrenCount: number;
  isStar: boolean;
}

export interface EntityMaterialVO extends MaterialVO {
  path?: Path;
  comment: string;
  sourceUrl: string;
  mimeType: string;
}
