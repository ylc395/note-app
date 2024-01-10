import type { EntityMaterialVO } from '@shared/domain/model/material';
import type { Tile } from '@domain/app/model/workbench';

import EditableMaterial from './EditableMaterial';
import ImageEditor from '../editor/ImageEditor';

interface Image {
  metadata: EntityMaterialVO;
  blob: ArrayBuffer;
}

export default class EditableImage extends EditableMaterial<Image> {
  constructor(materialId: EntityMaterialVO['id']) {
    super(materialId);
  }

  protected getEditor(tile: Tile) {
    return new ImageEditor(this, tile);
  }

  public async load() {
    return;
  }
}
