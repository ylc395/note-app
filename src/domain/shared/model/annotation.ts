import type { EntityId } from './entity.js';
import type { Note } from './note.js';

interface PdfTextPosition {
  startPage: number;
  startOffset: number;
  endPage: number;
  endOffset: number;
}

export interface PDFTextPositionSelector {
  type: 'PDFTextPositionSelector';
  fullText: string;
  position: PdfTextPosition;
}

export interface PDFRectSelector {
  type: 'PDFRectSelector';
  page: number;
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface HTMLTextPositionSelector {
  start: string;
  end: string;
  type: 'HTMLTextFragmentSelector';
}

export interface HTMLCssSelector {
  type: 'HTMLCssSelector';
  value: string; // css selector
}

export type Selector = PDFTextPositionSelector | PDFRectSelector | HTMLTextPositionSelector | HTMLCssSelector;

// This concept is inspired by https://www.w3.org/TR/annotation-model/
export interface Annotation {
  id: EntityId;
  targetId: Note['id'];
  selector: Selector;
  body: string;
  bodyPlainText?: string;
  color: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * @api
 */
export type AnnotationDTO = Pick<Annotation, 'selector' | 'targetId'> & Partial<Pick<Annotation, 'body' | 'color'>>;

/**
 * @api
 */
export type AnnotationPatchDTO = Partial<Pick<Annotation, 'body' | 'color' | 'selector'>>;

/**
 * @api
 */
export type AnnotationVO = Annotation;
