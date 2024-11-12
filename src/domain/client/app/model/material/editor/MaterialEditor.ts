import { normalizeTitle } from '#domain/shared/model/material';
import Editor from '#domain/client/app/model/abstract/Editor';
import type EditableMaterial from '#domain/client/app/model/material/editable/EditableMaterial';
import { computed } from 'mobx';

export default abstract class MaterialEditor<T extends EditableMaterial, S> extends Editor<T, S> {
  protected readonly normalizeTitle = normalizeTitle;

  @computed
  public get annotations() {
    return this.editable.annotations;
  }

  public readonly createAnnotation = this.editable.createAnnotation;
  public readonly updateAnnotation = this.editable.updateAnnotation;
  public readonly getAnnotation = this.editable.getAnnotation;
}
