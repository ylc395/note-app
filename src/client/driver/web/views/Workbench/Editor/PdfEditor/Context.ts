import { createContext } from 'react';
import { observable } from 'mobx';

import type { AnnotationVO } from 'interface/material';
import type PdfViewer from './PdfView/PdfViewer';

export enum Panels {
  Outline,
  AnnotationList,
}

interface EditorContext {
  pdfViewer: PdfViewer | null;
  hoveringAnnotationId: AnnotationVO['id'] | null;
  panelsVisibility: Record<Panels, boolean>;
}

export function getContext() {
  return observable(
    {
      pdfViewer: null,
      hoveringAnnotationId: null,
      panelsVisibility: {
        [Panels.Outline]: false,
        [Panels.AnnotationList]: true,
      },
    },
    {
      pdfViewer: observable.ref,
    },
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default createContext<EditorContext>(null as any);
