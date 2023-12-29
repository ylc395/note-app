import { action, makeObservable, observable } from 'mobx';
import { container } from 'tsyringe';
import { uniqueId, isMatch } from 'lodash';
import { Emitter } from 'strict-event-emitter';
import assert from 'assert';

import Editor, { EventNames as EditorEvents } from '@domain/app/model/abstract/Editor';
import type { EditableEntityLocator } from '@domain/app/model/abstract/EditableEntity';
import EditableEntityManager from '@domain/app/model/manager/EditableEntityManager';

export enum EventNames {
  Destroyed = 'tile.destroyed',
  Focus = 'tile.focus',
}

type Events = {
  [EventNames.Destroyed]: [];
  [EventNames.Focus]: [];
};

export default class Tile extends Emitter<Events> {
  constructor() {
    super();
    makeObservable(this);
  }

  public readonly id = uniqueId('tile-');
  private readonly editableEntityManager = container.resolve(EditableEntityManager);

  @observable.ref
  public currentEditor?: Editor;

  @observable.shallow
  public readonly editors: Editor[] = [];

  public findByEntity({ entityId, entityType }: EditableEntityLocator) {
    return this.editors.find((e) => isMatch(e.entityLocator, { entityId, entityType }));
  }

  @action.bound
  public switchToEditor(editor: Editor | EditableEntityLocator) {
    const existedTab = editor instanceof Editor ? this.editors.find((e) => editor === e) : this.findByEntity(editor);

    if (!existedTab) {
      return false;
    }

    this.currentEditor = existedTab;
    return true;
  }

  @action.bound
  public removeEditor(editor: Editor, destroy = true) {
    const existedTabIndex = this.editors.findIndex((e) => e === editor);
    assert(existedTabIndex >= 0, 'editor not in this tile');

    const [removedEditor] = this.editors.splice(existedTabIndex, 1);

    assert(removedEditor);
    removedEditor.off(EditorEvents.Focus, this.handleEditorFocus);

    if (destroy) {
      removedEditor.destroy();
    }

    if (this.currentEditor === editor) {
      this.currentEditor = this.editors[existedTabIndex] || this.editors[existedTabIndex - 1];
    }

    if (this.editors.length === 0) {
      this.destroy();
    }

    removedEditor.tile = undefined;
  }

  private readonly handleEditorFocus = () => {
    this.emit(EventNames.Focus);
  };

  @action.bound
  public closeAllEditors() {
    for (const editor of this.editors) {
      this.removeEditor(editor, true);
    }
  }

  @action
  public createEditor(entity: EditableEntityLocator, dest?: Editor) {
    if (dest) {
      assert(dest.tile === this);
    }

    const editableEntity = this.editableEntityManager.getOrCreateEditable(entity);
    const newEditor = editableEntity.createEditor(this);

    if (dest) {
      const destIndex = this.editors.findIndex((editor) => editor === dest);

      assert(destIndex >= 0, 'dest is not in this tile');
      this.editors.splice(destIndex, 0, newEditor);
    } else {
      this.editors.push(newEditor);
    }

    newEditor.on(EditorEvents.Focus, this.handleEditorFocus);

    return newEditor;
  }

  @action
  public addEditorTo(editor: Editor, to?: Editor) {
    const isWithin = this.editors.includes(editor);
    const existedEditorIndex = this.editors.findIndex((e) => isMatch(e.entityLocator, editor.entityLocator));

    if (existedEditorIndex >= 0) {
      const [existedEditor] = this.editors.splice(existedEditorIndex, 1);

      if (!isWithin) {
        existedEditor!.destroy();
      }
    }

    if (!isWithin) {
      editor.tile?.removeEditor(editor, false);
      editor.tile = this;
    }

    const destIndex = to ? this.editors.findIndex((editor) => editor === to) : -1;
    this.editors.splice(destIndex >= 0 ? destIndex : this.editors.length, 0, editor);
  }

  @action
  private destroy() {
    this.emit(EventNames.Destroyed);
    this.removeAllListeners();
    this.currentEditor = undefined;
  }
}
