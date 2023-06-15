import { observer, useLocalObservable } from 'mobx-react-lite';
import { observable } from 'mobx';

import type PdfEditorView from 'model/material/PdfEditorView';
import { Panels } from 'model/material/PdfEditorView';

import Toolbar from './Toolbar';
import AnnotationList from './AnnotationList';
import Context, { getContext } from './Context';
import Outline from './Outline';
import PdfViewer from './PdfView';

export default observer(function PdfEditorView({ editorView }: { editorView: PdfEditorView }) {
  const context = useLocalObservable(getContext, { pdfViewer: observable.ref });

  return (
    <div className="flex h-full w-full">
      <Context.Provider value={context}>
        <div className="flex h-full grow flex-col">
          <Toolbar />
          <div className="relative flex min-h-0 grow">
            {editorView.panelsVisibility[Panels.Outline] && <Outline />}
            <PdfViewer editorView={editorView} />
            {editorView.panelsVisibility[Panels.AnnotationList] && <AnnotationList />}
          </div>
        </div>
      </Context.Provider>
    </div>
  );
});
