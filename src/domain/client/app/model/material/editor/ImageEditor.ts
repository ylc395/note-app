import type Tile from '#domain/client/app/model/workbench/Tile';
import EditableMaterial from '../editable/EditableMaterial';
import MaterialEditor from './MaterialEditor';

interface UIState {
  scrollOffset: 0;
}

export default class ImageEditor extends MaterialEditor<UIState> {
  constructor(editable: EditableMaterial, tile: Tile) {
    super(editable, tile);
  }
}
