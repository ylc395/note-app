import EditorView from 'model/material/view/EditorView';
import type Tile from 'model/workbench/Tile';
import type ImageEditor from '../editor/ImageEditor';

interface State {
  scrollOffset: 0;
}

export default class ImageEditorView extends EditorView<ImageEditor, State> {
  constructor(tile: Tile, editor: ImageEditor) {
    super(tile, editor, { scrollOffset: 0 });
  }
}
