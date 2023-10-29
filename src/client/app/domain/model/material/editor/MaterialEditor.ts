import { makeObservable, observable, computed, action, runInAction } from 'mobx';
import type { AnnotationPatchDTO, AnnotationVO } from 'model/material';

import Editor from 'model/abstract/Editor';
import type Tile from 'model/workbench/Tile';
import type EditableMaterial from 'model/material/editable/Editable';

export default abstract class MaterialEditor<T extends EditableMaterial, S = unknown> extends Editor<T, S> {
  constructor(tile: Tile, editor: T) {
    super(tile, editor);
    makeObservable(this);
  }

  @computed
  get breadcrumbs() {
    return [];
  }

  @computed
  get tabView() {
    return {
      title: this.editable.entity?.metadata.name || '',
      icon: this.editable.entity?.metadata.icon || null,
    };
  }

  @observable currentAnnotationId: AnnotationVO['id'] | null = null;

  async removeCurrentAnnotation() {
    if (!this.currentAnnotationId) {
      throw new Error('no currentAnnotation');
    }

    await this.editable.removeAnnotation(this.currentAnnotationId);
    runInAction(() => {
      this.currentAnnotationId = null;
    });
  }

  async updateCurrentAnnotation(patch: AnnotationPatchDTO) {
    if (!this.currentAnnotationId) {
      throw new Error('no currentAnnotation');
    }

    await this.editable.updateCurrentAnnotation(this.currentAnnotationId, patch);
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
}
