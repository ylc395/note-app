import type { InjectionToken } from '@nestjs/common';
import type { MaterialDTO, MaterialQuery, MaterialVO } from 'interface/Material';

export const token: InjectionToken = Symbol('MaterialRepository');

export interface MaterialRepository {
  create: (files: MaterialDTO[]) => Promise<Pick<MaterialVO, 'id'>[]>;
  findAll: (query: MaterialQuery) => Promise<MaterialVO[]>;
  deleteOne: (id: MaterialVO['id']) => Promise<number>;
}
