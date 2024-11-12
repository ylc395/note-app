import MaterialEditor from '#domain/client/app/model/material/editor/MaterialEditor';
import type Tile from '#domain/client/app/model/workbench/Tile';
import type EditableImage from '../editable/EditableImage';

interface UIState {
  scrollOffset: 0;
}

export default class ImageEditor extends MaterialEditor<EditableImage, UIState> {
  constructor(editor: EditableImage, tile: Tile) {
    super(editor, tile);
  }
}
