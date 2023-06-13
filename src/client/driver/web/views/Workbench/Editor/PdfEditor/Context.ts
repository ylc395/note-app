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
  targetAnnotationId: AnnotationVO['id'] | null;
  referenceElMap: Record<AnnotationVO['id'], HTMLElement>;
  annotationTooltipRoot: HTMLElement | null;
  panelsVisibility: Record<Panels, boolean>;
}

export function getContext(): EditorContext {
  return observable(
    {
      pdfViewer: null,
      targetAnnotationId: null,
      annotationTooltipRoot: null,
      referenceElMap: {},
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
