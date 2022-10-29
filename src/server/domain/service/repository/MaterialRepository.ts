import type { InjectionToken } from '@nestjs/common';
import type { MaterialDTO } from 'interface/Material';
import type { Material } from 'model/Material';

export const token: InjectionToken = Symbol('MaterialRepository');

export interface MaterialRepository {
  create: (files: MaterialDTO[]) => Promise<Material[]>;
}
