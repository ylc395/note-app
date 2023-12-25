import { observer } from 'mobx-react-lite';

import type { Tile } from '@domain/app/model/workbench';
import NoteEditor from '@domain/app/model/note/Editor';
import ImageEditor from '@domain/app/model/material/editor/ImageEditor';
import PdfEditor from '@domain/app/model/material/editor/PdfEditor';
import HtmlEditor from '@domain/app/model/material/editor/HtmlEditor';
import Droppable from '@web/components/dnd/Droppable';

import NoteEditorView from './NoteEditor';
import ImageEditorView from './ImageEditor';
import PdfEditorView from './PdfEditor';
import HtmlEditorView from './HtmlEditor';
import useDrop from './useDrop';

export default observer(function Tile({ tile }: { tile: Tile }) {
  const { onDrop, onDragMove, dropArea } = useDrop(tile);

  return (
    <Droppable className="relative min-h-0 shrink grow" onDragMove={onDragMove} onDrop={onDrop}>
      {tile.currentEditor instanceof NoteEditor && <NoteEditorView editor={tile.currentEditor} />}
      {tile.currentEditor instanceof ImageEditor && <ImageEditorView editor={tile.currentEditor} />}
      {tile.currentEditor instanceof PdfEditor && <PdfEditorView editor={tile.currentEditor} />}
      {tile.currentEditor instanceof HtmlEditor && <HtmlEditorView editor={tile.currentEditor} />}
      {dropArea && <div className="absolute bg-blue-50 opacity-60" style={dropArea} />}
    </Droppable>
  );
});
