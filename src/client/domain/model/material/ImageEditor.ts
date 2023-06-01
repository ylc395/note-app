import { computed, makeObservable } from 'mobx';

import { EntityTypes } from 'interface/entity';
import { type EntityMaterialVO, normalizeTitle } from 'interface/material';
import Editor from 'model/abstract/Editor';
import type Tile from 'model/workbench/Tile';

interface Entity {
  metadata: EntityMaterialVO;
  blob: ArrayBuffer;
}

export default class ImageEditor extends Editor<Entity> {
  constructor(tile: Tile, materialId: EntityMaterialVO['id']) {
    super(tile, materialId);
    makeObservable(this);
  }

  protected async init() {
    return;
  }

  readonly entityType = EntityTypes.Material;

  @computed
  get breadcrumbs() {
    return [];
  }

  @computed
  get tabView() {
    return {
      title: this.entity ? normalizeTitle(this.entity.metadata) : '',
      icon: this.entity?.metadata.icon || null,
    };
  }
}
