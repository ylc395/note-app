import type { EntityId } from './entity.js';
import type { Note } from './note.js';

export interface PDFTextPositionSelector {
  type: 'PDFTextPositionSelector';
  fullText: string;
  color: string;
  position: {
    startPage: number;
    startOffset: number;
    endPage: number;
    endOffset: number;
  };
}

export interface PDFSvgSelector {
  type: 'PDFSvgSelector';
  page: number; // 我们不支持跨页的 SVG 绘制
  svg: string;
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

type Selector = PDFTextPositionSelector | PDFSvgSelector | HTMLTextPositionSelector | HTMLCssSelector;

// This concept is inspired by https://www.w3.org/TR/annotation-model/
export interface Annotation {
  id: EntityId;
  parentId: Note['id'];
  selector: Selector;
  body: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * @api
 */
export type AnnotationDTO = Pick<Annotation, 'selector' | 'parentId'> & Partial<Pick<Annotation, 'body'>>;

/**
 * @api
 */
export type AnnotationPatchDTO = Partial<Pick<Annotation, 'body'>>;

/**
 * @api
 */
export type AnnotationVO = Annotation;
