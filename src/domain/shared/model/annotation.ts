import type { EntityId } from './entity.js';
import type { Note } from './note.js';

// https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment/Text_fragments
interface TextFragment {
  textStart: string;
  textEnd?: string;
  suffix?: string;
  prefix?: string;
}

interface PdfTextFragment extends TextFragment {
  page: number;
}

export interface PDFTextFragmentSelector {
  type: 'PDFTextFragmentSelector';
  fullText: string;
  fragments: PdfTextFragment[]; // 我们假定每个 Fragment 的 page 总是不相同
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
