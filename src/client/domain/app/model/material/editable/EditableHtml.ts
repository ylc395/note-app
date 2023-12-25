import type { MaterialEntityVO } from '@shared/domain/model/material';
import type { Tile } from '@domain/app/model/workbench';
import EditableMaterial from './EditableMaterial';
import HtmlEditor from '../editor/HtmlEditor';
import { runInAction } from 'mobx';

interface WebPage {
  metadata: MaterialEntityVO;
  html: string;
}

export default class EditableHtml extends EditableMaterial<WebPage> {
  constructor(materialId: MaterialEntityVO['id']) {
    super(materialId);
  }

  protected getEditor(tile: Tile) {
    return new HtmlEditor(this, tile);
  }

  public async load() {
    const [{ body: metadata }, { body: blob }] = await Promise.all([
      this.remote.get<void, MaterialEntityVO>(`/materials/${this.entityId}`),
      this.remote.get<void, ArrayBuffer>(`/materials/${this.entityId}/blob`),
    ]);

    const textDecoder = new TextDecoder();
    runInAction(() => (this.entity = { metadata, html: textDecoder.decode(blob) }));
  }
}
