import { container } from 'tsyringe';
import { observer } from 'mobx-react-lite';

import type Tile from 'model/workbench/Tile';
import NoteEditor from 'model/note/Editor';
import ImageEditor from 'model/material/ImageEditor';
import PdfEditor from 'model/material/PdfEditor';
import HtmlEditor from 'model/material/HtmlEditor';
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
      {tile.currentEditor instanceof NoteEditor && <NoteEditorView editor={tile.currentEditor} />}
      {tile.currentEditor instanceof ImageEditor && <ImageEditorView editor={tile.currentEditor} />}
      {tile.currentEditor instanceof PdfEditor && <PdfEditorView editor={tile.currentEditor} />}
      {tile.currentEditor instanceof HtmlEditor && <HtmlEditorView editor={tile.currentEditor} />}
      {isOver ? <div className="absolute bg-blue-50 opacity-60" style={dropPosition} /> : null}
    </div>
  );
});
