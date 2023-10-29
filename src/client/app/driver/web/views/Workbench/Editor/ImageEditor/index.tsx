import { observer } from 'mobx-react-lite';
import type ImageEditor from 'model/material/editor/ImageEditor';

export default observer(function ImageEditorView({ editor }: { editor: ImageEditor }) {
  return <div>{editor.editable.entity?.blob.byteLength}</div>;
});
