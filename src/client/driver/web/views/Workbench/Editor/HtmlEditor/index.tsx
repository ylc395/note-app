import { observer } from 'mobx-react-lite';

import type HtmlEditor from 'model/material/HtmlEditor';
import HtmlViewer from './HtmlViewer';

customElements.define('html-viewer', HtmlViewer);

export default observer(function HtmlEditor({ editor }: { editor: HtmlEditor }) {
  return <html-viewer editor-id={editor.id} />;
});
