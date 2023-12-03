import type { MaterialEntityVO } from 'model/material';
import type { Tile } from 'model/workbench';

import EditableMaterial from './EditableMaterial';
import ImageEditor from '../editor/ImageEditor';

interface Image {
  metadata: MaterialEntityVO;
  blob: ArrayBuffer;
}

export default class EditableImage extends EditableMaterial<Image> {
  constructor(materialId: MaterialEntityVO['id']) {
    super(materialId);
  }

  protected getEditor(tile: Tile) {
    return new ImageEditor(this, tile);
  }

  async init() {
    return;
  }
}
