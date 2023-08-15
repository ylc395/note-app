import type { EntityMaterialVO } from 'model/material';
import type Tile from 'model/workbench/Tile';
import Editor from './Editor';

interface WebPage {
  metadata: EntityMaterialVO;
  html: string;
}

export default class HtmlEditor extends Editor<WebPage> {
  constructor(tile: Tile, materialId: EntityMaterialVO['id']) {
    super(tile, materialId);
  }

  protected async init() {
    const [{ body: metadata }, { body: blob }] = await Promise.all([
      this.remote.get<void, EntityMaterialVO>(`/materials/${this.entityId}`),
      this.remote.get<void, ArrayBuffer>(`/materials/${this.entityId}/blob`),
    ]);

    const textDecoder = new TextDecoder();
    this.load({ metadata, html: textDecoder.decode(blob) });
  }
}
