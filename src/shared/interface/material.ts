import {
  object,
  string,
  instanceof as zodInstanceof,
  array,
  number,
  discriminatedUnion,
  literal,
  tuple,
  type infer as Infer,
} from 'zod';
import type { EntityId } from './entity';

export const materialDTOSchema = object({
  name: string().min(1).optional(),
  parentId: string().nullable().optional(),
  icon: string().min(1).optional(),
  fileId: string().optional(),
  file: object({
    data: zodInstanceof(ArrayBuffer).or(string()).optional(),
    path: string().optional(),
    mimeType: string().min(1),
  }).optional(),
  sourceUrl: string().url().optional(),
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

export function normalizeTitle(material?: MaterialVO) {
  if (!material) {
    return '';
  }

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
  PdfRange = 1,
  PdfArea = 2,
  HtmlRange = 3,
}

const rectSchema = object({
  x: number(),
  y: number(),
  width: number(),
  height: number(),
});

export type Rect = Infer<typeof rectSchema>;

const commonAnnotationSchema = object({
  color: string(),
  comment: string().nullish(),
});

const PdfRangeAnnotationSchema = object({
  type: literal(AnnotationTypes.PdfRange),
  content: string(),
  fragments: array(
    object({
      page: number(),
      rect: rectSchema,
    }),
  ),
}).merge(commonAnnotationSchema);

const PdfAreaAnnotationSchema = object({
  type: literal(AnnotationTypes.PdfArea),
  snapshot: string(),
  rect: rectSchema,
  page: number(),
}).merge(commonAnnotationSchema);

const htmlRangeSchema = object({
  selector: string(),
  offset: number(),
});

const htmlRangeAnnotationSchema = object({
  type: literal(AnnotationTypes.HtmlRange),
  range: tuple([htmlRangeSchema, htmlRangeSchema]),
}).merge(commonAnnotationSchema);

export const annotationDTOSchema = discriminatedUnion('type', [
  PdfAreaAnnotationSchema,
  PdfRangeAnnotationSchema,
  htmlRangeAnnotationSchema,
]);

export const annotationPatchSchema = commonAnnotationSchema.partial();

export type AnnotationPatchDTO = Infer<typeof annotationPatchSchema>;

export type AnnotationDTO = Infer<typeof annotationDTOSchema>;

interface CommonAnnotationVO {
  id: EntityId;
  updatedAt: number;
  createdAt: number;
}

export type PdfRangeAnnotationVO = CommonAnnotationVO & Infer<typeof PdfRangeAnnotationSchema>;
export type PdfAreaAnnotationVO = CommonAnnotationVO & Infer<typeof PdfAreaAnnotationSchema>;
export type HtmlRangeAnnotationVO = CommonAnnotationVO & Infer<typeof htmlRangeAnnotationSchema>;
export type AnnotationVO = PdfRangeAnnotationVO | PdfAreaAnnotationVO | HtmlRangeAnnotationVO;
