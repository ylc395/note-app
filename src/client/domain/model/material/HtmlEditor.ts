import { computed, makeObservable, observable, runInAction } from 'mobx';

import { EntityMaterialVO, AnnotationVO, AnnotationTypes, HighlightElementAnnotationVO } from 'interface/material';
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

  @computed
  get highlightElements() {
    return this.annotations.filter(
      ({ type }) => type === AnnotationTypes.HighlightElement,
    ) as HighlightElementAnnotationVO[];
  }

  protected async init() {
    const [{ body: metadata }, { body: html }] = await Promise.all([
      this.remote.get<void, EntityMaterialVO>(`/materials/${this.entityId}`),
      this.remote.get<void, string>(`/materials/${this.entityId}/blob`),
    ]);

    this.load({ metadata, html });
  }
}
