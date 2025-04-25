import type { EntityId } from './entity.js';
import type { Note } from './note.js';

// https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment/Text_fragments
export interface TextFragment {
  textStart: string;
  textEnd?: string;
  suffix?: string;
  prefix?: string;
}

export interface PDFTextFragmentSelector extends TextFragment {
  type: 'PDFTextFragmentSelector';
  page: number;
  fullText: string;
}

export interface PDFRectSelector {
  type: 'PDFRectSelector';
  page: number;
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface HTMLTextFragmentSelector extends TextFragment {
  type: 'HTMLTextFragmentSelector';
}

export interface HTMLCssSelector {
  type: 'HTMLCssSelector';
  value: string; // css selector
}

export type Selector = PDFTextFragmentSelector | PDFRectSelector | HTMLTextFragmentSelector | HTMLCssSelector;

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
