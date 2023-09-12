import { object, number, string, literal, array, tuple, discriminatedUnion, type infer as Infer } from 'zod';
import type { EntityId } from '../entity';

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
  fragments: array(object({ page: number(), rect: rectSchema })),
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

export const newAnnotationDTOSchema = discriminatedUnion('type', [
  PdfAreaAnnotationSchema,
  PdfRangeAnnotationSchema,
  htmlRangeAnnotationSchema,
]);

export const annotationPatchDTOSchema = commonAnnotationSchema.partial();

export type AnnotationPatchDTO = Infer<typeof annotationPatchDTOSchema>;

export type NewAnnotationDTO = Infer<typeof newAnnotationDTOSchema>;

interface CommonAnnotationVO {
  id: EntityId;
  updatedAt: number;
  createdAt: number;
}

export type PdfRangeAnnotationVO = CommonAnnotationVO & Required<Infer<typeof PdfRangeAnnotationSchema>>;
export type PdfAreaAnnotationVO = CommonAnnotationVO & Required<Infer<typeof PdfAreaAnnotationSchema>>;
export type HtmlRangeAnnotationVO = CommonAnnotationVO & Required<Infer<typeof htmlRangeAnnotationSchema>>;
export type AnnotationVO = PdfRangeAnnotationVO | PdfAreaAnnotationVO | HtmlRangeAnnotationVO;
