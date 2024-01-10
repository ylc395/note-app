import type { EntityMaterialVO } from '@shared/domain/model/material';
import type { Tile } from '@domain/app/model/workbench';
import EditableMaterial from './EditableMaterial';
import HtmlEditor from '../editor/HtmlEditor';
import { runInAction } from 'mobx';

interface WebPage {
  metadata: EntityMaterialVO;
  html: string;
}

export default class EditableHtml extends EditableMaterial<WebPage> {
  constructor(materialId: EntityMaterialVO['id']) {
    super(materialId);
  }

  public createEditor(tile: Tile) {
    return new HtmlEditor(this, tile);
  }

  public async load() {
    const [{ body: metadata }, { body: blob }] = await Promise.all([
      this.remote.get<void, EntityMaterialVO>(`/materials/${this.entityId}`),
      this.remote.get<void, ArrayBuffer>(`/materials/${this.entityId}/blob`),
    ]);

    const textDecoder = new TextDecoder();
    runInAction(() => (this.entity = { metadata, html: textDecoder.decode(blob) }));
  }
}
