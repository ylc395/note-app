import { observer, useLocalObservable } from 'mobx-react-lite';
import { observable } from 'mobx';

import type HtmlEditor from 'model/material/HtmlEditor';
import HtmlViewer from './HtmlView';
import Toolbar from './Toolbar';
import Context, { getContext } from './Context';
import AnnotationList from './AnnotationList';

export default observer(function HtmlEditor({ editor }: { editor: HtmlEditor }) {
  const ctx = useLocalObservable(getContext, { htmlViewer: observable.ref });

  return (
    <div className="h-full">
      <Context.Provider value={ctx}>
        <div className="flex h-full grow flex-col">
          <Toolbar />
          <div className="flex min-h-0 grow">
            <HtmlViewer editor={editor} />
            <AnnotationList />
          </div>
        </div>
      </Context.Provider>
    </div>
  );
});
