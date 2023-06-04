import { observer } from 'mobx-react-lite';

import type HtmlEditor from 'model/material/HtmlEditor';
import HtmlViewer from './HtmlViewer';

export default observer(function HtmlEditor({ editor }: { editor: HtmlEditor }) {
  return (
    <div>
      <HtmlViewer editor={editor} />
    </div>
  );
});
