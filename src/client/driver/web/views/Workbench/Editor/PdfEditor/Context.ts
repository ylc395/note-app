import { createContext } from 'react';
import type PdfViewer from './PdfViewer';

export interface EditorContext {
  pdfViewer: PdfViewer | null;
  hoveringAnnotationEl: HTMLElement | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default createContext<EditorContext>(null as any);
