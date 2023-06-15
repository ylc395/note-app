import { createContext } from 'react';

import type HtmlViewer from './HtmlView/HtmlViewer';

export enum Panels {
  Outline,
  AnnotationList,
}

interface EditorContext {
  htmlViewer: HtmlViewer | null;
  panelsVisibility: Record<Panels, boolean>;
  setHtmlViewer: (v: HtmlViewer) => void;
}

export function getContext(): EditorContext {
  return {
    htmlViewer: null,
    setHtmlViewer: function (v: HtmlViewer) {
      this.htmlViewer = v;
    },
    panelsVisibility: {
      [Panels.Outline]: false,
      [Panels.AnnotationList]: true,
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default createContext<EditorContext>(null as any);
