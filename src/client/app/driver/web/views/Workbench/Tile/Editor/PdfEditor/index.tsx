import { observer, useLocalObservable } from 'mobx-react-lite';
import { observable } from 'mobx';

import type PdfEditor from '@domain/model/material/editor/PdfEditor';
import { Panels } from '@domain/model/material/editor/PdfEditor';

import Toolbar from './Toolbar';
import AnnotationList from './AnnotationList';
import Context, { getContext } from './Context';
import Outline from './Outline';
import PdfViewer from './PdfView';

export default observer(function PdfEditorView({ editor }: { editor: PdfEditor }) {
  const context = useLocalObservable(getContext, { pdfViewer: observable.ref });

  return (
    <div className="flex h-full w-full">
      <Context.Provider value={context}>
        <div className="flex grow flex-col">
          <Toolbar />
          <div className="relative flex min-h-0 grow">
            {editor.panelsVisibility[Panels.Outline] && <Outline />}
            <PdfViewer editor={editor} />
            {editor.panelsVisibility[Panels.AnnotationList] && <AnnotationList />}
          </div>
        </div>
      </Context.Provider>
    </div>
  );
});
