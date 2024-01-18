import { makeObservable, observable, computed, action, runInAction } from 'mobx';
import assert from 'assert';

import { normalizeTitle, type AnnotationPatchDTO, type AnnotationVO } from '@shared/domain/model/material';
import Editor from '@domain/app/model/abstract/Editor';
import type Tile from '@domain/app/model/workbench/Tile';
import type EditableMaterial from '@domain/app/model/material/editable/EditableMaterial';

export default abstract class MaterialEditor<T extends EditableMaterial, S = unknown> extends Editor<T, S> {
  constructor(editable: T, tile: Tile) {
    super(editable, tile);
    makeObservable(this);
  }

  protected readonly normalizeTitle = normalizeTitle;

  @observable currentAnnotationId: AnnotationVO['id'] | null = null;

  async removeCurrentAnnotation() {
    assert(this.currentAnnotationId);

    await this.editable.removeAnnotation(this.currentAnnotationId);
    runInAction(() => {
      this.currentAnnotationId = null;
    });
  }

  readonly createAnnotation = this.editable.createAnnotation;

  async updateCurrentAnnotation(patch: AnnotationPatchDTO) {
    assert(this.currentAnnotationId);

    await this.editable.updateAnnotation(this.currentAnnotationId, patch);
    runInAction(() => {
      this.currentAnnotationId = null;
    });
  }

  @computed
  get currentAnnotation() {
    const annotation = this.editable.annotations.find(({ id }) => this.currentAnnotationId === id);
    return annotation;
  }

  @action
  setCurrentAnnotationId(id: AnnotationVO['id'] | null) {
    this.currentAnnotationId = id;
  }

  get annotations() {
    return this.editable.annotations;
  }
}
