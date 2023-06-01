import { computed, makeObservable, observable } from 'mobx';
import { EntityTypes } from 'interface/entity';
import { type EntityMaterialVO, type AnnotationVO, normalizeTitle } from 'interface/material';
import EntityEditor from 'model/abstract/Editor';
import type Tile from 'model/workbench/Tile';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default abstract class Editor<T extends { metadata: EntityMaterialVO } = any> extends EntityEditor<T> {
  constructor(tile: Tile, materialId: EntityMaterialVO['id']) {
    super(tile, materialId);
    makeObservable(this);
  }

  readonly entityType = EntityTypes.Material;

  @observable
  protected readonly annotations: AnnotationVO[] = [];

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
