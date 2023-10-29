import { createContext } from 'react';
import { action, makeAutoObservable } from 'mobx';

import type HtmlViewer from './HtmlView/HtmlViewer';

interface EditorContext {
  htmlViewer: HtmlViewer | null;
  setHtmlViewer: (v: HtmlViewer) => void;
}

export function getContext(): EditorContext {
  return makeAutoObservable(
    {
      htmlViewer: null as null | HtmlViewer,
      setHtmlViewer(v: HtmlViewer) {
        this.htmlViewer = v;
      },
    },
    { setHtmlViewer: action.bound },
  );
}

export default createContext<EditorContext>(null as never);
