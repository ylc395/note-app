import { action, makeObservable, observable } from 'mobx';
import { container } from 'tsyringe';
import uniqueId from 'lodash/uniqueId';
import isMatch from 'lodash/isMatch';
import { Emitter } from 'strict-event-emitter';
import assert from 'assert';

import Editor, { EventNames as EditorEvents } from '@domain/model/abstract/Editor';
import type { EditableEntityLocator } from '@domain/model/abstract/EditableEntity';
import EditableEntityManager from './EditableEntityManager';

export enum EventNames {
  Destroyed = 'tile.destroyed',
  Focus = 'tile.focus',
}

type Events = {
  [EventNames.Destroyed]: [];
  [EventNames.Focus]: [];
};

export default class Tile extends Emitter<Events> {
  readonly id = uniqueId('tile-');
  private readonly editableEntityManager = container.resolve(EditableEntityManager);
  @observable.ref currentEditor?: Editor;
  @observable.shallow editors: Editor[] = [];

  constructor() {
    super();
    makeObservable(this);
  }

  @action.bound
  switchToEditor(editor: Editor | EditableEntityLocator) {
    const existedTab = this.editors.find((e) =>
      editor instanceof Editor ? editor === e : isMatch(editor, e.toEntityLocator()),
    );

    if (!existedTab) {
      return false;
    }

    this.currentEditor = existedTab;
    return true;
  }

  @action.bound
  removeEditor(editor: Editor, destroy = true) {
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
  closeAllEditors() {
    for (const editor of this.editors) {
      this.removeEditor(editor, true);
    }
  }

  @action
  createEditor(entity: EditableEntityLocator, dest?: Editor) {
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
  addEditor(editor: Editor, to?: Editor) {
    const existedEditorIndex = this.editors.findIndex((e) => isMatch(e.toEntityLocator(), editor.toEntityLocator()));

    if (existedEditorIndex >= 0) {
      const [existedEditor] = this.editors.splice(existedEditorIndex, 1);
      existedEditor!.destroy();
    }

    const destIndex = this.editors.findIndex((editor) => editor === to);

    editor.tile = this;
    this.editors.splice(destIndex >= 0 ? destIndex : this.editors.length, 0, editor);
    this.currentEditor = editor;
  }

  private destroy() {
    this.emit(EventNames.Destroyed);
    this.removeAllListeners();
    this.currentEditor = undefined;
  }
}
