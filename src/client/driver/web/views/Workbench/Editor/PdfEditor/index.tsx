import { observer } from 'mobx-react-lite';
import type PdfEditor from 'model/material/PdfEditor';

export default observer(function PdfEditorView({ editor }: { editor: PdfEditor }) {
  return <div>{editor.entityId}</div>;
});
