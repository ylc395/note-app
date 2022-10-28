import type { InjectionToken } from '@nestjs/common';
import type { MaterialDTO, MaterialVO } from 'dto/Material';

export const token: InjectionToken = Symbol('MaterialRepository');

export interface MaterialRepository {
  create: (files: MaterialDTO[]) => Promise<MaterialVO[]>;
}
