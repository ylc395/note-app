import { observer } from 'mobx-react-lite';
import type ImageEditor from 'model/material/ImageEditor';

export default observer(function ImageEditorView({ editor }: { editor: ImageEditor }) {
  return <div>{editor.entityId}</div>;
});
