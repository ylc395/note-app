import { observer } from 'mobx-react-lite';
import type ImageEditor from '@domain/app/model/material/editor/ImageEditor';

export default observer(function ImageEditorView({ editor }: { editor: ImageEditor }) {
  return <div>{JSON.stringify(editor.entityLocator)}</div>;
});
