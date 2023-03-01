import { container } from 'tsyringe';
import { observer } from 'mobx-react-lite';

import type Tile from 'model/workbench/Tile';
import NoteEditor from 'model/note/Editor';

import EditorService from 'service/EditorService';

import NoteEditorView from './NoteEditor';

export default observer(function Editor({ tileId }: { tileId: Tile['id'] }) {
  const { tileManager } = container.resolve(EditorService);
  const tile = tileManager.getTile(tileId);

  if (tile.currentEditor instanceof NoteEditor) {
    return <NoteEditorView editor={tile.currentEditor} />;
  }

  return null;
});
