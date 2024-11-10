import type { EntityId } from './entity.js';
import type { CommonFragment, TextQuoteFragment } from './fragment.js';
import type { EntityMaterial } from './material.js';

interface HtmlSelector {
  selector: string; // CSS selector
}

type Selector = HtmlSelector | TextQuoteFragment | CommonFragment;

// This concept is inspired by https://www.w3.org/TR/annotation-model/
export interface Annotation {
  id: EntityId;
  targetId: EntityMaterial['id'];
  selectors: Selector[];
  body: string;
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
export type AnnotationPatchDTO = Partial<Pick<Annotation, 'body' | 'color'>>;

/**
 * @api
 */
export type AnnotationVO = Annotation;
