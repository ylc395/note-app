import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import type PdfEditor from 'model/material/PdfEditor';

import Toolbar from './Toolbar';
import HighlightList from './HighlightList';
import Context, { Panels, getContext } from './Context';
import Outline from './Outline';
import PdfViewer from './PdfView';

export default observer(function PdfEditorView({ editor }: { editor: PdfEditor }) {
  const [context] = useState(getContext);

  return (
    <div className="flex h-full w-full">
      <Context.Provider value={context}>
        <div className="flex h-full grow flex-col">
          <Toolbar />
          <div className="relative flex min-h-0 grow">
            {context.panelsVisibility[Panels.Outline] && <Outline />}
            <PdfViewer editor={editor} />
            {context.panelsVisibility[Panels.HighlightList] && <HighlightList />}
          </div>
        </div>
      </Context.Provider>
    </div>
  );
});
