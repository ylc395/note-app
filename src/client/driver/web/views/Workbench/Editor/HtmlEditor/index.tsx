import { observer } from 'mobx-react-lite';

import type HtmlEditor from 'model/material/HtmlEditor';
import HtmlViewer from './HtmlView';
import Toolbar from './Toolbar';
import Context, { getContext } from './Context';
import { useState } from 'react';

export default observer(function HtmlEditor({ editor }: { editor: HtmlEditor }) {
  const [ctx] = useState(getContext);

  return (
    <div className="h-full">
      <Context.Provider value={ctx}>
        <Toolbar />
        <HtmlViewer editor={editor} />
      </Context.Provider>
    </div>
  );
});
