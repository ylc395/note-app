import { makeObservable, observable, runInAction } from 'mobx';
import remove from 'lodash/remove';

import { EntityTypes } from 'model/entity';
import type { MaterialEntityVO, AnnotationVO, NewAnnotationDTO, AnnotationPatchDTO } from 'model/material';
import Editable from 'model/abstract/Editable';

export default abstract class EditableMaterial<
  T extends { metadata: MaterialEntityVO } = { metadata: MaterialEntityVO },
> extends Editable<T> {
  constructor(materialId: MaterialEntityVO['id']) {
    super(materialId);
    makeObservable(this);
    this.loadAnnotations();
  }

  readonly entityType = EntityTypes.Material;

  @observable readonly annotations: AnnotationVO[] = [];

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
      this.annotations.push(...annotations);
    });
  }
  async removeAnnotation(id: AnnotationVO['id']) {
    await this.remote.delete(`/materials/annotations/${id}`);
    runInAction(() => {
      remove(this.annotations, ({ id: _id }) => _id === id);
    });
  }

  async updateCurrentAnnotation(id: AnnotationVO['id'], patch: AnnotationPatchDTO) {
    const { body: annotation } = await this.remote.patch<Record<string, unknown>, AnnotationVO>(
      `/materials/annotations/${id}`,
      patch,
    );

    runInAction(() => {
      const index = this.annotations.findIndex(({ id: _id }) => _id === id);

      if (index < 0) {
        throw new Error('no annotation');
      }

      this.annotations[index] = annotation;
    });
  }

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
