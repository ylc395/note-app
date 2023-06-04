import { observer, useLocalObservable } from 'mobx-react-lite';
import { observable } from 'mobx';

import type PdfEditor from 'model/material/PdfEditor';

import Toolbar from './Toolbar';
import HighlightList from './HighlightList';
import Context, { type EditorContext, Panels } from './Context';
import Outline from './Outline';
import PdfViewer from './PdfView';

export default observer(function PdfEditorView({ editor }: { editor: PdfEditor }) {
  const context = useLocalObservable<EditorContext>(
    () => ({
      pdfViewer: null,
      hoveringAnnotationId: null,
      panelsVisibility: {
        [Panels.Outline]: false,
        [Panels.HighlightList]: true,
      },
    }),
    { pdfViewer: observable.ref },
  );

  return (
    <Context.Provider value={context}>
      <div className="flex h-full w-full">
        <div className="flex h-full grow flex-col">
          <Toolbar />
          <div className="relative flex min-h-0 grow">
            {context.panelsVisibility[Panels.Outline] && <Outline />}
            <PdfViewer editor={editor} />
            {context.panelsVisibility[Panels.HighlightList] && <HighlightList />}
          </div>
        </div>
      </div>
    </Context.Provider>
  );
});
