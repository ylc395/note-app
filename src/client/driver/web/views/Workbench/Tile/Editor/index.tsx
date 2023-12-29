import { observer } from 'mobx-react-lite';

import type { Tile } from '@domain/app/model/workbench';
import NoteEditor from '@domain/app/model/note/Editor';
import ImageEditor from '@domain/app/model/material/editor/ImageEditor';
import PdfEditor from '@domain/app/model/material/editor/PdfEditor';
import HtmlEditor from '@domain/app/model/material/editor/HtmlEditor';

import NoteEditorView from './NoteEditor';
import ImageEditorView from './ImageEditor';
import PdfEditorView from './PdfEditor';
import HtmlEditorView from './HtmlEditor';

export default observer(function Tile({ tile }: { tile: Tile }) {
  return (
    <div className="relative min-h-0 shrink grow">
      {tile.currentEditor instanceof NoteEditor && <NoteEditorView editor={tile.currentEditor} />}
      {tile.currentEditor instanceof ImageEditor && <ImageEditorView editor={tile.currentEditor} />}
      {tile.currentEditor instanceof PdfEditor && <PdfEditorView editor={tile.currentEditor} />}
      {tile.currentEditor instanceof HtmlEditor && <HtmlEditorView editor={tile.currentEditor} />}
    </div>
  );
});
