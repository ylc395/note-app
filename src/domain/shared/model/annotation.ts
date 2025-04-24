import type { EntityId } from './entity.js';
import type { Note } from './note.js';

export const MAX_SELECTORS_COUNT = 5;

export interface Selector {
  refinedBy?: unknown;
}

// https://www.w3.org/TR/annotation-model/#text-position-selector
export interface TextPositionSelector extends Selector {
  type: 'TextPositionSelector';
  start: number;
  end: number;
}

// https://www.w3.org/TR/annotation-model/#fragment-selector
export interface FragmentSelector extends Selector {
  type: 'FragmentSelector';
  value: string;
}

// https://www.w3.org/TR/annotation-model/#css-selector
export interface CssSelector extends Selector {
  type: 'CssSelector';
  value: string;
}

// This concept is inspired by https://www.w3.org/TR/annotation-model/
export interface Annotation {
  id: EntityId;
  targetId: Note['id'];
  selectors: Array<Selector>;
  body: string;
  bodyPlainText?: string;
  color: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * @api
 */
export type AnnotationDTO = Pick<Annotation, 'selectors' | 'targetId'> & Partial<Pick<Annotation, 'body' | 'color'>>;

/**
 * @api
 */
export type AnnotationPatchDTO = Partial<Pick<Annotation, 'body' | 'color' | 'selectors'>>;

/**
 * @api
 */
export type AnnotationVO = Annotation;
