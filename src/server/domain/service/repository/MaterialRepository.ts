import type { InjectionToken } from '@nestjs/common';
import type { MaterialWithoutFile, File } from 'model/Material';

export const token: InjectionToken = Symbol('MaterialRepository');

export interface MaterialRepository {
  createByFiles: (files: File[]) => Promise<MaterialWithoutFile[]>;
}
