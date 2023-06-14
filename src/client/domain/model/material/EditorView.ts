import { makeObservable, observable, computed, action, runInAction } from 'mobx';
import type { AnnotationPatchDTO, AnnotationVO } from 'interface/material';

import EditorView from 'model/abstract/EditorView';
import type Tile from 'model/workbench/Tile';
import type MaterialEditor from 'model/material/Editor';

export default abstract class MaterialEditorView<T extends MaterialEditor, S = unknown> extends EditorView<T, S> {
  constructor(tile: Tile, editor: T, state: S) {
    super(tile, editor, state);
    makeObservable(this);
  }

  @observable currentAnnotationId: AnnotationVO['id'] | null = null;

  async removeCurrentAnnotation() {
    if (!this.currentAnnotationId) {
      throw new Error('no currentAnnotation');
    }

    await this.editor.removeAnnotation(this.currentAnnotationId);
    runInAction(() => {
      this.currentAnnotationId = null;
    });
  }

  async updateCurrentAnnotation(patch: AnnotationPatchDTO) {
    if (!this.currentAnnotationId) {
      throw new Error('no currentAnnotation');
    }

    await this.editor.updateCurrentAnnotation(this.currentAnnotationId, patch);
    runInAction(() => {
      this.currentAnnotationId = null;
    });
  }

  @computed
  get currentAnnotation() {
    const annotation = this.editor.annotations.find(({ id }) => this.currentAnnotationId === id);
    return annotation;
  }

  @action
  setCurrentAnnotationId(id: AnnotationVO['id'] | null) {
    this.currentAnnotationId = id;
  }
}
