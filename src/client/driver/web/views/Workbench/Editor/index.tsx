import { container } from 'tsyringe';
import { observer } from 'mobx-react-lite';

import type Tile from 'model/workbench/Tile';
import NoteEditor from 'model/note/EditorView';
import ImageEditor from 'model/material/view/ImageEditorView';
import PdfEditor from 'model/material/view/PdfEditorView';
import HtmlEditor from 'model/material/view/HtmlEditorView';
import EditorService from 'service/EditorService';

import NoteEditorView from './NoteEditor';
import ImageEditorView from './ImageEditor';
import PdfEditorView from './PdfEditor';
import HtmlEditorView from './HtmlEditor';
import useDrop from './useDrop';

export default observer(function Editor({ tileId }: { tileId: Tile['id'] }) {
  const { tileManager } = container.resolve(EditorService);
  const tile = tileManager.getTile(tileId);
  const { setNodeRef, isOver, dropPosition } = useDrop(tile);

  return (
    <div ref={setNodeRef} className="relative min-h-0 shrink grow">
      {tile.currentEditorView instanceof NoteEditor && <NoteEditorView editorView={tile.currentEditorView} />}
      {tile.currentEditorView instanceof ImageEditor && <ImageEditorView editorView={tile.currentEditorView} />}
      {tile.currentEditorView instanceof PdfEditor && <PdfEditorView editorView={tile.currentEditorView} />}
      {tile.currentEditorView instanceof HtmlEditor && <HtmlEditorView editorView={tile.currentEditorView} />}
      {isOver ? <div className="absolute bg-blue-50 opacity-60" style={dropPosition} /> : null}
    </div>
  );
});
