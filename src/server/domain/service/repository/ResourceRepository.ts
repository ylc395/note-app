import type { ResourceVO } from 'interface/resource';

export type FileQuery = {
  sourceUrl: NonNullable<ResourceVO['sourceUrl']>[];
};

export type RawFile = Pick<ResourceVO, 'name' | 'mimeType'> & {
  data: ArrayBuffer;
  sourceUrl?: string;
};

export interface ResourceRepository {
  findAll: (query: FileQuery) => Promise<ResourceVO[]>;
  findOneById: (id: ResourceVO['id']) => Promise<ResourceVO | null>;
  batchCreate: (files: RawFile[]) => Promise<ResourceVO[]>;
  create: (file: RawFile) => Promise<ResourceVO>;
  findFileById: (id: ResourceVO['id']) => Promise<{ mimeType: ResourceVO['mimeType']; data: ArrayBuffer } | null>;
}
