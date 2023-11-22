import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useDroppable } from '@dnd-kit/core';

import type { Tile } from 'model/workbench';
import NoteEditor from 'model/note/Editor';
import ImageEditor from 'model/material/editor/ImageEditor';
import PdfEditor from 'model/material/editor/PdfEditor';
import HtmlEditor from 'model/material/editor/HtmlEditor';
import DndService from 'service/DndService';
import TileHandler from 'service/DndService/TileHandler';

import NoteEditorView from './NoteEditor';
import ImageEditorView from './ImageEditor';
import PdfEditorView from './PdfEditor';
import HtmlEditorView from './HtmlEditor';

export default observer(function Editor({ tile }: { tile: Tile }) {
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `${tile.id}-tile`,
    data: { instance: tile },
  });
  const dndService = container.resolve(DndService);
  const { dropAreaPosition, targetTileId } = dndService.getHandler(TileHandler);

  return (
    <div className="relative min-h-0 shrink grow" ref={setDroppableRef}>
      {tile.currentEditor instanceof NoteEditor && <NoteEditorView editor={tile.currentEditor} />}
      {tile.currentEditor instanceof ImageEditor && <ImageEditorView editor={tile.currentEditor} />}
      {tile.currentEditor instanceof PdfEditor && <PdfEditorView editor={tile.currentEditor} />}
      {tile.currentEditor instanceof HtmlEditor && <HtmlEditorView editor={tile.currentEditor} />}
      {isOver && dropAreaPosition && targetTileId === tile.id ? (
        <div className="absolute bg-blue-50 opacity-60" style={dropAreaPosition} />
      ) : null}
    </div>
  );
});
