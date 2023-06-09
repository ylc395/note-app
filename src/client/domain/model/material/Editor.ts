import { computed, makeObservable, observable, runInAction } from 'mobx';
import remove from 'lodash/remove';

import { EntityTypes } from 'interface/entity';
import {
  type EntityMaterialVO,
  type AnnotationVO,
  type AnnotationDTO,
  type AnnotationPatchDTO,
  normalizeTitle,
} from 'interface/material';
import EntityEditor from 'model/abstract/Editor';
import type Tile from 'model/workbench/Tile';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default abstract class Editor<T extends { metadata: EntityMaterialVO } = any, S = unknown> extends EntityEditor<
  T,
  S
> {
  constructor(tile: Tile, materialId: EntityMaterialVO['id'], initialState: S) {
    super(tile, materialId, initialState);
    makeObservable(this);
    this.loadAnnotations();
  }

  readonly entityType = EntityTypes.Material;

  @observable
  readonly annotations: AnnotationVO[] = [];

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

  async updateAnnotation(id: AnnotationVO['id'], patch: AnnotationPatchDTO) {
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

  getAnnotationById(id: AnnotationVO['id']) {
    const annotation = this.annotations.find(({ id: _id }) => _id === id);

    if (!annotation) {
      throw new Error('invalid id');
    }

    return annotation;
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
