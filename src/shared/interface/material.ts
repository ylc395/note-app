import {
  object,
  string,
  instanceof as zodInstanceof,
  array,
  number,
  discriminatedUnion,
  literal,
  type infer as Infer,
} from 'zod';
import type { EntityId } from './entity';

export const materialDTOSchema = object({
  name: string().min(1).optional(),
  parentId: string().nullable().optional(),
  icon: string().min(1).optional(),
  file: object({
    name: string().min(1),
    data: zodInstanceof(ArrayBuffer).optional(),
    path: string().optional(),
    mimeType: string().min(1),
  }).optional(),
  sourceUrl: string().url().optional(),
  text: string().min(1).optional(),
});

export type MaterialDTO = Infer<typeof materialDTOSchema>;

export interface DirectoryVO {
  id: EntityId;
  name: string;
  icon: string | null;
  parentId: DirectoryVO['id'] | null;
  childrenCount: number;
}

export type EntityMaterialVO = Omit<DirectoryVO, 'childrenCount'> & {
  mimeType: string;
  sourceUrl: string | null;
  createdAt: number;
  updatedAt: number;
};

export type MaterialVO = DirectoryVO | EntityMaterialVO;

export const materialQuerySchema = object({
  parentId: string().optional(),
});

export type MaterialQuery = Infer<typeof materialQuerySchema>;

export const isDirectory = (entity: MaterialVO): entity is DirectoryVO => {
  return !('mimeType' in entity);
};

export function normalizeTitle(material: MaterialVO) {
  if (material.name) {
    return material.name;
  }

  if (isDirectory(material)) {
    return '未命名目录';
  }

  if (material.mimeType.startsWith('image')) {
    return '未命名图片';
  }

  return '未命名文件';
}

export enum AnnotationTypes {
  Highlight = 1,
  HighlightArea,
}

const highlightDTOSchema = object({
  icon: string().optional(),
  content: string(),
  color: string(),
  fragments: array(
    object({
      page: number(),
      rect: object({ x: number(), y: number(), height: number(), width: number() }),
    }),
  ),
});

const highlightAreaDTOSchema = object({
  snapshot: string(),
  rect: object({
    top: number().optional(),
    bottom: number().optional(),
    left: number().optional(),
    right: number().optional(),
    height: number(),
    width: number(),
  }),
  page: number(),
});

export type HighlightDTO = Infer<typeof highlightDTOSchema>;

export type HighlightVO = HighlightDTO;

export type HighlightAreaDTO = Infer<typeof highlightAreaDTOSchema>;
export type HighlightAreaVO = HighlightAreaDTO;

export const annotationDTOSchema = discriminatedUnion('type', [
  object({ type: literal(AnnotationTypes.Highlight), annotation: highlightDTOSchema }),
  object({ type: literal(AnnotationTypes.HighlightArea), annotation: highlightAreaDTOSchema }),
]).and(
  object({
    comment: string().optional(),
  }),
);

export type AnnotationDTO = Infer<typeof annotationDTOSchema>;

export type AnnotationVO = {
  id: EntityId;
  comment: string | null;
  updatedAt: number;
  createdAt: number;
} & (
  | { type: AnnotationTypes.Highlight; annotation: HighlightVO }
  | { type: AnnotationTypes.HighlightArea; annotation: HighlightAreaVO }
);
