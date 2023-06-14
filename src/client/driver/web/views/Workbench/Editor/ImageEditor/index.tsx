import { observer } from 'mobx-react-lite';
import type ImageEditor from 'model/material/ImageEditorView';

export default observer(function ImageEditorView({ editorView }: { editorView: ImageEditor }) {
  return <div>{editorView.editor.entity?.blob.byteLength}</div>;
});
