import type { InjectionToken } from '@nestjs/common';
import type { FileVO } from 'dto/File';
import type { File } from 'model/File';

export const token: InjectionToken = Symbol('FileRepository');

export interface FileRepository {
  create: (file: File) => Promise<FileVO>;
}
