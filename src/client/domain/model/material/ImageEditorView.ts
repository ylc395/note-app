import EditorView from 'model/material/EditorView';
import type ImageEditor from './ImageEditor';
import type Tile from 'model/workbench/Tile';

interface State {
  scrollOffset: 0;
}

export default class ImageEditorView extends EditorView<ImageEditor, State> {
  constructor(tile: Tile, editor: ImageEditor) {
    super(tile, editor, { scrollOffset: 0 });
  }
}
