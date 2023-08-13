import {
  object,
  string,
  array,
  number,
  discriminatedUnion,
  literal,
  tuple,
  nativeEnum,
  preprocess,
  type infer as Infer,
} from 'zod';
import type { EntityId, EntityParentId } from '../entity';
import type { Starable } from '../star';

export const materialDTOSchema = object({
  name: string().min(1).optional(),
  parentId: string().nullable().optional(),
  icon: string().min(1).optional(),
  fileId: string().optional(),
  sourceUrl: string().url().optional(),
});

export type MaterialDTO = Infer<typeof materialDTOSchema>;

export enum MaterialTypes {
  Directory = 1,
  Entity,
}

export interface MaterialVO extends Starable {
  id: EntityId;
  name: string;
  icon: string | null;
  parentId: EntityParentId;
  createdAt: number;
  updatedAt: number;
}

export interface DirectoryVO extends MaterialVO {
  childrenCount: number;
}

export interface EntityMaterialVO extends MaterialVO {
  mimeType: string;
  sourceUrl: string | null;
}

export const isDirectory = (entity: MaterialVO): entity is DirectoryVO => {
  return 'childrenCount' in entity;
};

export const isEntityMaterial = (entity: MaterialVO): entity is EntityMaterialVO => {
  return 'mimeType' in entity;
};

export const clientMaterialQuerySchema = object({
  parentId: string().nullable().optional(),
  type: preprocess((v) => v && Number(v), nativeEnum(MaterialTypes).optional()),
});

export type ClientMaterialQuery = Infer<typeof clientMaterialQuerySchema>;

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

const PdfRangeAnnotationSchema = commonAnnotationSchema.extend({
  type: literal(AnnotationTypes.PdfRange),
  content: string(),
  fragments: array(
    object({
      page: number(),
      rect: rectSchema,
    }),
  ),
});

const PdfAreaAnnotationSchema = commonAnnotationSchema.extend({
  type: literal(AnnotationTypes.PdfArea),
  snapshot: string(),
  rect: rectSchema,
  page: number(),
});

const htmlRangeSchema = object({
  selector: string(),
  offset: number(),
});

const htmlRangeAnnotationSchema = commonAnnotationSchema.extend({
  type: literal(AnnotationTypes.HtmlRange),
  range: tuple([htmlRangeSchema, htmlRangeSchema]),
});

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
export type AnnotationVO = (PdfRangeAnnotationVO | PdfAreaAnnotationVO | HtmlRangeAnnotationVO) & {
  materialId?: MaterialVO['id'];
};
