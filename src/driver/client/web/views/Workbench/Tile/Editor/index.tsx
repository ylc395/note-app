import { observer } from 'mobx-react-lite';

import NoteEditor from '#domain/client/app/model/note/editor/BaseEditor';
import ImageEditor from '#domain/client/app/model/material/editor/ImageEditor';
import HtmlEditor from '#domain/client/app/model/material/editor/HtmlEditor';
import type Tile from '#domain/client/app/model/Workbench/Tile';

import NoteEditorView from './NoteEditor';
import ImageEditorView from './ImageEditor';
import HtmlEditorView from './HtmlEditor';

export default observer(function Tile({ tile }: { tile: Tile }) {
  return (
    <div className="relative min-h-0 shrink grow">
      {tile.currentEditor instanceof NoteEditor && <NoteEditorView editor={tile.currentEditor} />}
      {tile.currentEditor instanceof ImageEditor && <ImageEditorView editor={tile.currentEditor} />}
      {tile.currentEditor instanceof HtmlEditor && <HtmlEditorView editor={tile.currentEditor} />}
    </div>
  );
});
