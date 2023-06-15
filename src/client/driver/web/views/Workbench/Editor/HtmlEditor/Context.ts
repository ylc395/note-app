import { createContext } from 'react';

import type HtmlViewer from './HtmlView/HtmlViewer';

interface EditorContext {
  htmlViewer: HtmlViewer | null;
  setHtmlViewer: (v: HtmlViewer) => void;
}

export function getContext(): EditorContext {
  return {
    htmlViewer: null,
    setHtmlViewer: function (v: HtmlViewer) {
      this.htmlViewer = v;
    },
  };
}

export default createContext<EditorContext>(null as never);
