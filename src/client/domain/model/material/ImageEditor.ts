import type { EntityMaterialVO } from 'interface/material';
import type Tile from 'model/workbench/Tile';
import Editor from './Editor';

interface Entity {
  metadata: EntityMaterialVO;
  blob: ArrayBuffer;
}

function getDefaultState() {
  return { scrollOffset: 0 };
}

type State = ReturnType<typeof getDefaultState>;

export default class ImageEditor extends Editor<Entity, State> {
  constructor(tile: Tile, materialId: EntityMaterialVO['id']) {
    super(tile, materialId, getDefaultState());
  }

  protected async init() {
    return;
  }
}
