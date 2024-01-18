import type { EntityMaterialVO } from '@shared/domain/model/material';
import type { Tile } from '@domain/app/model/workbench';

import EditableMaterial from './EditableMaterial';
import ImageEditor from '../editor/ImageEditor';

export default class EditableImage extends EditableMaterial {
  constructor(materialId: EntityMaterialVO['id']) {
    super(materialId);
  }

  public createEditor(tile: Tile) {
    return new ImageEditor(this, tile);
  }

  public async load() {
    return;
  }
}
