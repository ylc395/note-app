import { computed, observable } from 'mobx';
import assert from 'assert';

import { IS_DEV } from '#domain/shared/infra/constants';
import { normalizeTitle } from '#domain/shared/model/material';
import { AnnotationVO } from '#domain/shared/model/annotation';

import Editor from '../../abstract/Editor';
import type EditableMaterial from '../editable/EditableMaterial';
import AnnotationEditor, { EventNames as AnnotationEditorEventNames } from '../../annotation/Editor';

export default abstract class MaterialEditor<S> extends Editor<EditableMaterial, S> {
  @observable.ref private accessor annotationEditorsMap: Record<AnnotationVO['id'] | symbol, AnnotationEditor> = {};

  @computed
  public get annotationEditors() {
    return Object.values(this.annotationEditorsMap);
  }

  @computed
  public get isCreatingNewAnnotation() {
    return Boolean(this.annotationEditorsMap[MaterialEditor.NEW_ANNOTATION_EDITOR_ID]);
  }

  public startEditingAnnotation(annotation?: AnnotationVO) {
    let editor: AnnotationEditor;

    if (annotation) {
      editor = new AnnotationEditor({ annotation });
      this.annotationEditorsMap[annotation.id] = editor;
    } else {
      assert(this.editable.entity, 'can not creating new annotation editor');
      const id = MaterialEditor.NEW_ANNOTATION_EDITOR_ID;

      assert(!this.annotationEditorsMap[id], 'new annotation editor is active');
      editor = new AnnotationEditor({ material: this.editable.entity });
      this.annotationEditorsMap[id] = editor;
    }

    editor.on(AnnotationEditorEventNames.Submitted, this.editable.loadAnnotations.bind(this.editable));

    editor.on(AnnotationEditorEventNames.Destroyed, () => {
      const id = annotation?.id ?? MaterialEditor.NEW_ANNOTATION_EDITOR_ID;
      delete this.annotationEditorsMap[id];
    });
  }

  @computed
  public get view() {
    const titlePrefix = IS_DEV ? `${this.id} ${this.entityLocator.entityId.slice(0, 3)} ` : '';

    return {
      title: titlePrefix + (this.editable.entity ? normalizeTitle(this.editable.entity) : ''),
      breadcrumbs: this.editable.path || [],
      icon: this.editable.entity?.icon || null,
    };
  }

  private static NEW_ANNOTATION_EDITOR_ID = Symbol();
}
