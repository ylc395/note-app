import { makeObservable, observable } from 'mobx';

import type { EntityMaterialVO } from 'interface/material';
import type Tile from 'model/workbench/Tile';
import Editor from './Editor';

interface WebPage {
  metadata: EntityMaterialVO;
  html: string;
}

export default class HtmlEditor extends Editor<WebPage> {
  constructor(tile: Tile, materialId: EntityMaterialVO['id']) {
    super(tile, materialId);
    makeObservable(this);
  }

  @observable.ref
  documentElement?: unknown;

  protected async init() {
    const [{ body: metadata }, { body: html }] = await Promise.all([
      this.remote.get<void, EntityMaterialVO>(`/materials/${this.entityId}`),
      this.remote.get<void, string>(`/materials/${this.entityId}/blob`),
    ]);

    this.load({ metadata, html });
  }
}
