import type { MaterialEntityVO } from 'model/material';
import EditableMaterial from './EditableMaterial';

interface Image {
  metadata: MaterialEntityVO;
  blob: ArrayBuffer;
}

export default class EditableImage extends EditableMaterial<Image> {
  constructor(materialId: MaterialEntityVO['id']) {
    super(materialId);
  }

  async init() {
    return;
  }
}
