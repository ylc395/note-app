import type { EntityId } from './entity.js';
import type { CommonFragment, TextQuoteFragment } from './fragment.js';
import type { Note } from './note.js';

interface HtmlSelector {
  selector: string; // CSS selector
}

export type Selector = HtmlSelector | TextQuoteFragment | CommonFragment;

// This concept is inspired by https://www.w3.org/TR/annotation-model/
export interface Annotation {
  id: EntityId;
  targetId: Note['id'];
  selectors: Selector[];
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
