import dayjs from 'dayjs';
import type { infer as Infer } from 'zod';
import {
  type Material,
  type MaterialTypes,
  type AnnotationVO,
  isDirectory,
  materialsPatchDTOSchema,
} from 'shard/model/material';

export interface MaterialQuery {
  parentId?: Material['parentId'];
  id?: Material['id'][];
  type?: MaterialTypes;
}

export type Annotation = AnnotationVO & {
  materialId: Material['id'];
};

export type MaterialPatch = Infer<typeof materialsPatchDTOSchema>['material'] & { updatedAt?: number };

export function normalizeTitle(v: Material) {
  return v.name || `${isDirectory(v) ? '未命名目录' : '未命名素材'}${dayjs.unix(v.createdAt).format('YYYYMMDD-HHmm')}`;
}

export * from 'shard/model/material';
