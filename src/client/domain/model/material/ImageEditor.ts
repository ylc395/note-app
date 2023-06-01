import type { EntityMaterialVO } from 'interface/material';
import type Tile from 'model/workbench/Tile';
import Editor from './Editor';

interface Entity {
  metadata: EntityMaterialVO;
  blob: ArrayBuffer;
}

export default class ImageEditor extends Editor<Entity> {
  constructor(tile: Tile, materialId: EntityMaterialVO['id']) {
    super(tile, materialId);
  }

  protected async init() {
    return;
  }
}
