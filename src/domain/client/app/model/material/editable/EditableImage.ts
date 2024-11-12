import type { EntityMaterialVO } from '#domain/shared/model/material';
import type { Tile } from '#domain/client/app/model/workbench';

import EditableMaterial from './EditableMaterial';
import ImageEditor from '../editor/ImageEditor';

export default class EditableImage extends EditableMaterial {
  constructor(materialId: EntityMaterialVO['id']) {
    super(materialId);
  }

  public createEditor(tile: Tile) {
    return new ImageEditor(this, tile);
  }
}
