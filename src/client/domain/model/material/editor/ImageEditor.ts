import type { MaterialEntityVO } from 'model/material';
import type Tile from 'model/workbench/Tile';
import Editor from './Editor';

interface Entity {
  metadata: MaterialEntityVO;
  blob: ArrayBuffer;
}

export default class ImageEditor extends Editor<Entity> {
  constructor(tile: Tile, materialId: MaterialEntityVO['id']) {
    super(tile, materialId);
  }

  protected async init() {
    return;
  }
}
