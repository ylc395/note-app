import type { InjectionToken } from '@nestjs/common';
import type { File } from 'model/File';

export const token: InjectionToken = Symbol('FileRepository');

export interface FileRepository {
  create: (files: Partial<File>) => Promise<Omit<File, 'data'>>;
}
