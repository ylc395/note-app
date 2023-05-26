import { createContext } from 'react';
import type PdfViewer from './PdfViewer';
import type { AnnotationVO } from 'interface/material';

export interface EditorContext {
  pdfViewer: PdfViewer | null;
  hoveringAnnotationId: AnnotationVO['id'] | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default createContext<EditorContext>(null as any);
