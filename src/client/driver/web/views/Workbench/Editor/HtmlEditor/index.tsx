import { observer } from 'mobx-react-lite';

import type HtmlEditor from 'model/material/HtmlEditor';

export default observer(function HtmlEditor({ editor }: { editor: HtmlEditor }) {
  return <div dangerouslySetInnerHTML={{ __html: editor.entity?.html || '' }}></div>;
});
