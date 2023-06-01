import { computed, makeObservable, observable, runInAction } from 'mobx';

import Editor from 'model/abstract/Editor';
import { EntityTypes } from 'interface/entity';
import { type EntityMaterialVO, type AnnotationVO, normalizeTitle } from 'interface/material';
import type Tile from 'model/workbench/Tile';

interface WebPage {
  metadata: EntityMaterialVO;
  html: string;
}

export default class HtmlEditor extends Editor<WebPage> {
  constructor(tile: Tile, materialId: EntityMaterialVO['id']) {
    super(tile, materialId);
    makeObservable(this);
  }

  readonly entityType = EntityTypes.Material;

  @computed
  get breadcrumbs() {
    return [];
  }

  @observable
  private readonly annotations: AnnotationVO[] = [];

  @computed
  get tabView() {
    return {
      title: this.entity ? normalizeTitle(this.entity.metadata) : '',
      icon: this.entity?.metadata.icon || null,
    };
  }

  protected async init() {
    const [{ body: metadata }, { body: html }] = await Promise.all([
      this.remote.get<void, EntityMaterialVO>(`/materials/${this.entityId}`),
      this.remote.get<void, string>(`/materials/${this.entityId}/blob`),
    ]);

    this.load({ metadata, html });

    const { body: annotations } = await this.remote.get<unknown, AnnotationVO[]>(
      `/materials/${this.entityId}/annotations`,
    );

    runInAction(() => {
      this.annotations.push(...annotations);
    });
  }
}
