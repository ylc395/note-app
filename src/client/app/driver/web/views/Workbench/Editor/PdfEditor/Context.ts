import { createContext } from 'react';

import type PdfViewer from './PdfView/PdfViewer';

interface EditorContext {
  pdfViewer: PdfViewer | null;
  setPdfViewer: (v: PdfViewer) => void;
}

export function getContext(): EditorContext {
  return {
    pdfViewer: null,
    setPdfViewer: function (v) {
      this.pdfViewer = v;
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default createContext<EditorContext>(null as any);
