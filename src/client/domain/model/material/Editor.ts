import { computed, makeObservable, observable, runInAction } from 'mobx';
import { EntityTypes } from 'interface/entity';
import { type EntityMaterialVO, type AnnotationVO, type AnnotationDTO, normalizeTitle } from 'interface/material';
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

  async createAnnotation(annotation: AnnotationDTO) {
    const { body: createdAnnotation } = await this.remote.post<AnnotationDTO, AnnotationVO>(
      `/materials/${this.entityId}/annotations`,
      annotation,
    );

    runInAction(() => {
      this.annotations.push(createdAnnotation);
    });
  }

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

export const ANNOTATION_COLORS = [
  /* Yellow */ '#2596be',
  /* Red */ '#ef0005',
  /* Blue */ '#0008ef',
  /* Purple */ '#b000ef',
  /* Gray */ '#a2a2a2',
];
