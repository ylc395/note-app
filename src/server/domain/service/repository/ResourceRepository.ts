import type { ResourceVO } from 'interface/resource';
import type { File } from 'model/file';

export type FileQuery = {
  sourceUrl: NonNullable<ResourceVO['sourceUrl']>[];
};

export interface ResourceRepository {
  findAll: (query: FileQuery) => Promise<ResourceVO[]>;
  findOneById: (id: ResourceVO['id']) => Promise<ResourceVO | null>;
  batchCreate: (files: File[]) => Promise<ResourceVO[]>;
  create: (file: File) => Promise<ResourceVO>;
  findFileById: (id: ResourceVO['id']) => Promise<{ mimeType: ResourceVO['mimeType']; data: ArrayBuffer } | null>;
}
