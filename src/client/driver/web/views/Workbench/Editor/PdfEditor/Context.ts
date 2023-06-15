import { createContext } from 'react';

import type PdfViewer from './PdfView/PdfViewer';

export enum Panels {
  Outline,
  AnnotationList,
}

interface EditorContext {
  pdfViewer: PdfViewer | null;
  setPdfViewer: (v: PdfViewer) => void;
  panelsVisibility: Record<Panels, boolean>;
}

export function getContext(): EditorContext {
  return {
    pdfViewer: null,
    setPdfViewer: function (v) {
      this.pdfViewer = v;
    },
    panelsVisibility: {
      [Panels.Outline]: false,
      [Panels.AnnotationList]: true,
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default createContext<EditorContext>(null as any);
