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
    data: zodInstanceof(ArrayBuffer).or(string()).optional(),
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
  HighlightElement,
}

const rectSchema = object({
  x: number(),
  y: number(),
  width: number(),
  height: number(),
});

export type Rect = Infer<typeof rectSchema>;

const highlightSchema = object({
  content: string(),
  color: string(),
  fragments: array(
    object({
      page: number(),
      rect: rectSchema,
    }),
  ),
});

const highlightAreaSchema = object({
  color: string().optional(),
  snapshot: string(),
  rect: rectSchema,
  page: number(),
});

const highlightElementSchema = object({
  color: string(),
  selector: string(),
});

export const annotationDTOSchema = discriminatedUnion('type', [
  highlightSchema.extend({ type: literal(AnnotationTypes.Highlight) }),
  highlightAreaSchema.extend({ type: literal(AnnotationTypes.HighlightArea) }),
  highlightElementSchema.extend({ type: literal(AnnotationTypes.HighlightElement) }),
]).and(
  object({
    comment: string().optional(),
  }),
);

export const annotationPatchSchema = object({
  comment: string().optional(),
  color: string().optional(),
});

export type AnnotationPatchDTO = Infer<typeof annotationPatchSchema>;

export type AnnotationDTO = Infer<typeof annotationDTOSchema>;

interface CommonAnnotationVO {
  id: EntityId;
  comment: string | null;
  updatedAt: number;
  createdAt: number;
}

export interface HighlightAnnotationVO extends CommonAnnotationVO, Infer<typeof highlightSchema> {
  type: AnnotationTypes.Highlight;
}

export interface HighlightAreaAnnotationVO extends CommonAnnotationVO, Infer<typeof highlightAreaSchema> {
  type: AnnotationTypes.HighlightArea;
}

export interface HighlightElementAnnotationVO extends CommonAnnotationVO, Infer<typeof highlightElementSchema> {
  type: AnnotationTypes.HighlightElement;
}

export type AnnotationVO = HighlightAnnotationVO | HighlightAreaAnnotationVO | HighlightElementAnnotationVO;
