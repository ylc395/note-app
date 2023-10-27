import MaterialEditor from 'model/material/editor/MaterialEditor';
import type Tile from 'model/workbench/Tile';
import type EditableImage from '../editable/EditableImage';

interface UIState {
  scrollOffset: 0;
}

export default class ImageEditor extends MaterialEditor<EditableImage, UIState> {
  constructor(tile: Tile, editor: EditableImage) {
    super(tile, editor, { scrollOffset: 0 });
  }
}
