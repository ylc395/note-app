import { observer } from 'mobx-react-lite';

import type HtmlEditor from 'model/material/HtmlEditor';
import HtmlViewer from './HtmlView';

export default observer(function HtmlEditor({ editor }: { editor: HtmlEditor }) {
  return (
    <div className="h-full">
      <HtmlViewer editor={editor} />
    </div>
  );
});
