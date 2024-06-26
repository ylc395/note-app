import type { EntityId } from './entity.js';

export enum SelectorTypes {
  CSS = 'CssSelector',
  Fragment = 'FragmentSelector',
  Range = 'RangeSelector',
}

interface CssSelector {
  type: SelectorTypes.CSS;
  value: string;
  offset?: string;
}

export interface FragmentSelector {
  type: SelectorTypes.Fragment;
  value: string; // see https://www.w3.org/TR/annotation-model/#fragment-selector
}

interface RangeSelector {
  type: SelectorTypes.Range;
  start: CssSelector;
  end: CssSelector;
}

type Selector = CssSelector | FragmentSelector | RangeSelector;

/**
 * @api
 */
export interface AnnotationDTO {
  targetId: string;
  selectors: Selector[];
  body?: string;
  targetText?: string | null;
  color: string;
}

/**
 * @api
 */
export type AnnotationPatchDTO = Pick<AnnotationDTO, 'body' | 'color'>;

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

/**
 * @api
 */
export type AnnotationVO = Annotation;
