import { computed, makeObservable, observable, runInAction } from 'mobx';
import { remove } from 'lodash';
import assert from 'assert';

import { EntityTypes } from '@shared/domain/model/entity';
import {
  type EntityMaterialVO,
  type AnnotationVO,
  type NewAnnotationDTO,
  type AnnotationPatchDTO,
  isEntityMaterial,
} from '@shared/domain/model/material';
import EditableEntity from '@domain/app/model/abstract/EditableEntity';

export default abstract class EditableMaterial extends EditableEntity {
  protected readonly entityType = EntityTypes.Material;
  @observable annotations: AnnotationVO[] = [];

  constructor(materialId: EntityMaterialVO['id']) {
    super(materialId);
    makeObservable(this);
    this.loadAnnotations();
  }

  @observable
  public info?: Required<EntityMaterialVO>;

  @observable.ref
  protected blob?: ArrayBuffer;

  protected async load() {
    const [info, blob] = await Promise.all([
      this.remote.material.queryOne.query(this.entityLocator.entityId),
      this.remote.material.getBlob.query(this.entityLocator.entityId),
    ]);

    assert(isEntityMaterial(info) && info.path);

    runInAction(() => {
      this.info = info as Required<EntityMaterialVO>;
      this.blob = blob as ArrayBuffer;
    });
  }

  async createAnnotation(annotation: NewAnnotationDTO) {
    const createdAnnotation = await this.remote.material.createAnnotation.mutate([
      this.entityLocator.entityId,
      annotation,
    ]);

    runInAction(() => {
      this.annotations.push(createdAnnotation);
    });
  }

  private async loadAnnotations() {
    const annotations = await this.remote.material.queryAnnotations.query(this.entityLocator.entityId);

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

  @computed
  public get entityLocator() {
    return { ...super.entityLocator, mimeType: this.info?.mimeType };
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
