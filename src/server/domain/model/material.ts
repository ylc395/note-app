import type { MaterialVO, MaterialTypes, MaterialDTO } from 'shard/model/material';

export type Directory = Pick<MaterialDTO, 'name' | 'parentId' | 'icon'>;

export type Material = Omit<MaterialVO, 'isStar'>;

export interface MaterialQuery {
  parentId?: MaterialVO['parentId'];
  id?: MaterialVO['id'][];
  type?: MaterialTypes;
}

export function normalizeTitle(v: unknown) {
  return 'material-title';
}

export * from 'shard/model/material';
