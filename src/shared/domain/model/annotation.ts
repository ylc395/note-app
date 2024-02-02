import { array, discriminatedUnion, literal, number, object, string, type infer as ZodInfer } from 'zod';
import type { EntityId } from './entity.js';

export enum SelectorTypes {
  CSS = 'CssSelector',
  Fragment = 'FragmentSelector',
  Range = 'RangeSelector',
}

const cssSelectorSchema = object({
  type: literal(SelectorTypes.CSS),
  value: string(),
  offset: number().optional(),
});

const fragmentSelectorSchema = object({
  type: literal(SelectorTypes.Fragment),
  value: string(), // see https://www.w3.org/TR/annotation-model/#fragment-selector
});

const rangeSelectorSchema = object({
  type: literal(SelectorTypes.Range),
  start: cssSelectorSchema,
  end: cssSelectorSchema,
});

const selectorSchema = discriminatedUnion('type', [cssSelectorSchema, fragmentSelectorSchema, rangeSelectorSchema]);

export const annotationDTOSchema = object({
  targetId: string(),
  selectors: array(selectorSchema),
  body: string().optional(),
  targetText: string().nullish(),
  color: string(),
});

export const annotationPatchDTOSchema = annotationDTOSchema.pick({
  body: true,
  color: true,
});

type CssSelector = ZodInfer<typeof cssSelectorSchema>;
export type FragmentSelector = ZodInfer<typeof fragmentSelectorSchema>;
type RangeSelector = ZodInfer<typeof rangeSelectorSchema>;
type Selector = CssSelector | FragmentSelector | RangeSelector;

export interface Annotation {
  id: EntityId;
  targetId: EntityId;
  targetText: string | null;
  selectors: Selector[];
  body: string;
  color: string;
  createdAt: number;
  updatedAt: number;
}

export type AnnotationDTO = ZodInfer<typeof annotationDTOSchema>;

export type AnnotationPatchDTO = ZodInfer<typeof annotationPatchDTOSchema>;

export type AnnotationVO = Annotation;
