import { createContext } from 'react';
import { observable } from 'mobx';

import type HtmlViewer from './HtmlView/HtmlViewer';

export enum Panels {
  Outline,
  AnnotationList,
}

interface EditorContext {
  htmlViewer: HtmlViewer | null;
  panelsVisibility: Record<Panels, boolean>;
}

export function getContext() {
  return observable(
    {
      htmlViewer: null,
      panelsVisibility: {
        [Panels.Outline]: false,
        [Panels.AnnotationList]: true,
      },
    },
    {
      htmlViewer: observable.ref,
    },
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default createContext<EditorContext>(null as any);
