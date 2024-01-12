import { makeObservable, observable, runInAction } from 'mobx';
import { remove } from 'lodash';
import assert from 'assert';

import { EntityTypes } from '@shared/domain/model/entity';
import type {
  EntityMaterialVO,
  AnnotationVO,
  NewAnnotationDTO,
  AnnotationPatchDTO,
} from '@shared/domain/model/material';
import EditableEntity from '@domain/app/model/abstract/EditableEntity';

interface Material {
  metadata: EntityMaterialVO;
}

export default abstract class EditableMaterial<T extends Material = Material> extends EditableEntity<T> {
  readonly entityType = EntityTypes.Material;
  @observable annotations: AnnotationVO[] = [];

  constructor(materialId: EntityMaterialVO['id']) {
    super(materialId);
    makeObservable(this);
    this.loadAnnotations();
  }

  async createAnnotation(annotation: NewAnnotationDTO) {
    const createdAnnotation = await this.remote.material.createAnnotation.mutate([this.entityId, annotation]);

    runInAction(() => {
      this.annotations.push(createdAnnotation);
    });
  }

  private async loadAnnotations() {
    const annotations = await this.remote.material.queryAnnotations.query(this.entityId);

    runInAction(() => {
      this.annotations = annotations;
    });
  }

  async removeAnnotation(id: AnnotationVO['id']) {
    await this.remote.material.removeAnnotation.mutate(id);
    runInAction(() => {
      remove(this.annotations, { id });
    });
  }

  async updateAnnotation(id: AnnotationVO['id'], patch: AnnotationPatchDTO) {
    const annotation = await this.remote.material.updateAnnotation.mutate([id, patch]);

    runInAction(() => {
      const index = this.annotations.findIndex(({ id: _id }) => _id === id);

      assert(index > 0, 'no annotation');
      this.annotations[index] = annotation;
    });
  }

  public toEntityLocator() {
    return { ...super.toEntityLocator(), mimeType: this.entity?.metadata.mimeType };
  }

  public destroy() {}
}

export const ANNOTATION_COLORS = [
  /* Yellow */ '#2596be',
  /* Red */ '#ef0005',
  /* Blue */ '#0008ef',
  /* Purple */ '#b000ef',
  /* Gray */ '#a2a2a2',
];
