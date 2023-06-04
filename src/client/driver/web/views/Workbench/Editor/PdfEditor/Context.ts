import { createContext } from 'react';

import type { AnnotationVO } from 'interface/material';
import type PdfViewer from './PdfViewer';

export enum Panels {
  Outline,
  HighlightList,
}

export interface EditorContext {
  pdfViewer: PdfViewer | null;
  hoveringAnnotationId: AnnotationVO['id'] | null;
  panelsVisibility: Record<Panels, boolean>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default createContext<EditorContext>(null as any);
