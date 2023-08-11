import { useCreation } from 'ahooks';

import type HtmlEditor from 'model/material/view/HtmlEditorView';
import HtmlViewer from './HtmlView';
import Toolbar from './Toolbar';
import Context, { getContext } from './Context';
import AnnotationList from './AnnotationList';

// eslint-disable-next-line mobx/missing-observer
export default (function HtmlEditor({ editorView }: { editorView: HtmlEditor }) {
  const ctx = useCreation(getContext, []);

  return (
    <div className="h-full">
      <Context.Provider value={ctx}>
        <div className="flex h-full grow flex-col">
          <Toolbar />
          <div className="flex min-h-0 grow">
            <HtmlViewer editorView={editorView} />
            <AnnotationList />
          </div>
        </div>
      </Context.Provider>
    </div>
  );
});
