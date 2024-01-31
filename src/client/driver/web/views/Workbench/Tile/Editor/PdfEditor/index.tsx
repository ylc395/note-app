import { observer } from 'mobx-react-lite';

import { type default as PdfEditor, Panels } from '@domain/app/model/material/editor/PdfEditor';
import Toolbar from './Toolbar';
import context from './Context';
import Outline from './Outline';
import PdfViewer from './PdfView';

export default observer(function PdfEditorView({ editor }: { editor: PdfEditor }) {
  return (
    <context.Provider value={{ editor }}>
      <div className="flex h-full min-w-full flex-col">
        <Toolbar />
        <div className="relative flex min-h-0 grow">
          {editor.panelsVisibility[Panels.Outline] && <Outline />}
          <PdfViewer editor={editor} />
          {/* {editor.panelsVisibility[Panels.AnnotationList] && <AnnotationList />} */}
        </div>
      </div>
    </context.Provider>
  );
});
