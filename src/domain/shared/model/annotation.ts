import type { Selector } from '@apache-annotator/selector';
import type { EntityId } from './entity.js';
import type { Note } from './note.js';

export const MAX_SELECTORS_COUNT = 5;

export function isSelectors(value: unknown[]): value is Selector[] {
  return (
    value.length <= MAX_SELECTORS_COUNT &&
    value.every((value) => {
      return Boolean(
        typeof value === 'object' &&
          value &&
          'type' in value &&
          typeof value.type === 'string' &&
          value.type.endsWith('Selector'),
      );
    })
  );
}

// https://www.w3.org/TR/annotation-model/#fragment-selector
export interface FragmentSelector extends Selector {
  type: 'FragmentSelector';
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
