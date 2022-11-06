import type { InjectionToken } from '@nestjs/common';
import type { MaterialDTO, MaterialQuery, MaterialVO, AggregatedMaterialVO } from 'interface/Material';

export const token: InjectionToken = Symbol('MaterialRepository');

export interface MaterialRepository {
  create: (files: MaterialDTO[]) => Promise<MaterialVO[]>;
  findAll: (query: MaterialQuery) => Promise<AggregatedMaterialVO[]>;
}
