import type { EntityId } from './entity.js';

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

// inspired by https://developer.mozilla.org/en-US/docs/Web/Text_fragments#syntax
// and https://www.w3.org/TR/annotation-model/#text-quote-selector
export interface TextQuoteSelector {
  type: SelectorTypes.TEXT;
  value: {
    start: string;
    end?: string;
    prefix?: string;
    suffix?: string;
  };
}

// inspired by https://datatracker.ietf.org/doc/html/rfc3778#section-3
export interface PDFFragmentSelector {
  type: SelectorTypes.PDF;
  value: {
    page: number;
    height: number;
    width: number;
    left: number;
    top: number;
  };
}

// inspired by https://www.w3.org/TR/media-frags/#fragment-dimensions
export interface MediaFragmentSelector {
  type: SelectorTypes.MEDIA;
  value: {
    start: number;
    end: number;
  };
}

export type FragmentSelector = TextQuoteSelector | PDFFragmentSelector | MediaFragmentSelector;

type Selector = CssSelector | FragmentSelector;

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
