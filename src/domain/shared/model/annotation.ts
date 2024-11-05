import type { EntityId } from './entity.js';
import type { MediaFragment, PDFFragment, TextQuoteFragment } from './fragment.js';

export enum SelectorTypes {
  CSS = 'CSS',
  PDF = 'PDF',
  TEXT = 'TEXT',
  MEDIA = 'MEDIA',
}

// inspired by https://www.w3.org/TR/annotation-model/#css-selector
interface CssSelector {
  type: SelectorTypes.CSS;
  value: string;
}

export interface TextQuoteSelector {
  type: SelectorTypes.TEXT;
  value: TextQuoteFragment;
}

export interface PDFFragmentSelector {
  type: SelectorTypes.PDF;
  value: PDFFragment;
}

export interface MediaFragmentSelector {
  type: SelectorTypes.MEDIA;
  value: MediaFragment;
}

type Selector = CssSelector | TextQuoteSelector | PDFFragmentSelector | MediaFragmentSelector;

// This concept is inspired by https://www.w3.org/TR/annotation-model/
export interface Annotation {
  id: EntityId;
  targetId: EntityId;
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
