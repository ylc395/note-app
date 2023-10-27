import type { MaterialEntityVO } from 'model/material';
import EditableMaterial from './Editable';

interface WebPage {
  metadata: MaterialEntityVO;
  html: string;
}

export default class EditableHtml extends EditableMaterial<WebPage> {
  constructor(materialId: MaterialEntityVO['id']) {
    super(materialId);
  }

  protected async init() {
    const [{ body: metadata }, { body: blob }] = await Promise.all([
      this.remote.get<void, MaterialEntityVO>(`/materials/${this.entityId}`),
      this.remote.get<void, ArrayBuffer>(`/materials/${this.entityId}/blob`),
    ]);

    const textDecoder = new TextDecoder();
    this.load({ metadata, html: textDecoder.decode(blob) });
  }
}
