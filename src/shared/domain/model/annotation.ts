import { discriminatedUnion, literal, number, object, string, type infer as ZodInfer } from 'zod';
import type { EntityId } from './entity.js';

export enum SelectorTypes {
  CSS = 'CssSelector',
  Fragment = 'FragmentSelector',
  TextPosition = 'TextPositionSelector',
}

const cssSelectorSchema = object({
  type: literal(SelectorTypes.CSS),
  value: string(),
});

const textPositionSchema = object({
  type: literal(SelectorTypes.TextPosition),
  start: number(),
  end: number(),
});

const fragmentSelectorSchema = object({
  type: literal(SelectorTypes.Fragment),
  value: string(), // see https://www.w3.org/TR/annotation-model/#fragment-selector
});

export const annotationDTOSchema = object({
  targetId: string(),
  selector: discriminatedUnion('type', [cssSelectorSchema, fragmentSelectorSchema, textPositionSchema]),
  body: string(),
});

export const annotationPatchDTOSchema = object({
  body: string(),
});

type CssSelector = ZodInfer<typeof cssSelectorSchema>;
type TextPositionSelector = ZodInfer<typeof textPositionSchema>;
type FragmentSelector = ZodInfer<typeof fragmentSelectorSchema>;

export interface Annotation {
  id: EntityId;
  targetId: EntityId;
  selector: CssSelector | TextPositionSelector | FragmentSelector;
  body: string;
  createdAt: number;
  updatedAt: number;
}

export type AnnotationDTO = ZodInfer<typeof annotationDTOSchema>;

export type AnnotationPatchDTO = ZodInfer<typeof annotationPatchDTOSchema>;

export type AnnotationVO = Annotation;
