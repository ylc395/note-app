import { observer } from 'mobx-react-lite';
import type ImageEditor from '@domain/model/material/editor/ImageEditor';

export default observer(function ImageEditorView({ editor }: { editor: ImageEditor }) {
  return <div>{JSON.stringify(editor.getEntityLocator())}</div>;
});
