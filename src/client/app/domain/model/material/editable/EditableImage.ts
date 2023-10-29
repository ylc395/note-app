import type { MaterialEntityVO } from 'model/material';
import EditableMaterial from './Editable';

interface Entity {
  metadata: MaterialEntityVO;
  blob: ArrayBuffer;
}

export default class EditableImage extends EditableMaterial<Entity> {
  constructor(materialId: MaterialEntityVO['id']) {
    super(materialId);
  }

  protected async init() {
    return;
  }
}
