import type { InjectionToken } from '@nestjs/common';
import type { Material } from 'model/Material';

export const token: InjectionToken = Symbol('MaterialRepository');

export interface MaterialRepository {
  create: (files: Partial<Material>[]) => Promise<Material[]>;
}
