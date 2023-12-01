import { makeObservable, observable, runInAction } from 'mobx';
import remove from 'lodash/remove';

import { EntityTypes } from 'model/entity';
import type { MaterialEntityVO, AnnotationVO, NewAnnotationDTO, AnnotationPatchDTO } from 'model/material';
import EditableEntity from 'model/abstract/EditableEntity';
import assert from 'assert';

interface Material {
  metadata: MaterialEntityVO;
}

export default abstract class EditableMaterial<T extends Material = Material> extends EditableEntity<T> {
  readonly entityType = EntityTypes.Material;
  @observable annotations: AnnotationVO[] = [];

  constructor(materialId: MaterialEntityVO['id']) {
    super(materialId);
    makeObservable(this);
    this.loadAnnotations();
  }

  async createAnnotation(annotation: NewAnnotationDTO) {
    const { body: createdAnnotation } = await this.remote.post<NewAnnotationDTO, AnnotationVO>(
      `/materials/${this.entityId}/annotations`,
      annotation,
    );

    runInAction(() => {
      this.annotations.push(createdAnnotation);
    });
  }

  private async loadAnnotations() {
    const { body: annotations } = await this.remote.get<unknown, AnnotationVO[]>(
      `/materials/${this.entityId}/annotations`,
    );

    runInAction(() => {
      this.annotations = annotations;
    });
  }

  async removeAnnotation(id: AnnotationVO['id']) {
    await this.remote.delete(`/materials/annotations/${id}`);
    runInAction(() => {
      remove(this.annotations, { id });
    });
  }

  async updateAnnotation(id: AnnotationVO['id'], patch: AnnotationPatchDTO) {
    const { body: annotation } = await this.remote.patch<Record<string, unknown>, AnnotationVO>(
      `/materials/annotations/${id}`,
      patch,
    );

    runInAction(() => {
      const index = this.annotations.findIndex(({ id: _id }) => _id === id);

      assert(index > 0, 'no annotation');
      this.annotations[index] = annotation;
    });
  }

  destroy() {}

  toEntityLocator() {
    return { ...super.toEntityLocator(), mimeType: this.entity?.metadata.mimeType };
  }
}

export const ANNOTATION_COLORS = [
  /* Yellow */ '#2596be',
  /* Red */ '#ef0005',
  /* Blue */ '#0008ef',
  /* Purple */ '#b000ef',
  /* Gray */ '#a2a2a2',
];
