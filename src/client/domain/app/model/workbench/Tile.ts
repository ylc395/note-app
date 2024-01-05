import { action, makeObservable, observable } from 'mobx';
import { container } from 'tsyringe';
import { uniqueId, isMatch } from 'lodash';
import { Emitter } from 'strict-event-emitter';
import assert from 'assert';

import Editor from '@domain/app/model/abstract/Editor';
import type { EditableEntityLocator } from '@domain/app/model/abstract/EditableEntity';
import EditableEntityManager from './EditableEntityManager';
import type { EntityLocator } from '../entity';

export enum EventNames {
  Destroyed = 'tile.destroyed',
  Switched = 'tile.switched',
}

type Events = {
  [EventNames.Destroyed]: [];
  [EventNames.Switched]: [Editor];
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

  public findByEntity({ entityId, entityType }: EntityLocator) {
    return this.editors.find((e) => isMatch(e.entityLocator, { entityId, entityType }));
  }

  @action.bound
  public switchToEditor(editor: Editor | EditableEntityLocator, reason?: Editor['visibilityReason']) {
    const existedTab = editor instanceof Editor ? this.editors.find((e) => editor === e) : this.findByEntity(editor);

    if (!existedTab) {
      return false;
    }

    this.currentEditor = existedTab;
    this.currentEditor.visibilityReason = reason;
    this.emit(EventNames.Switched, this.currentEditor);
    return true;
  }

  @action.bound
  public removeEditor(editor: Editor, destroy = true) {
    const existedTabIndex = this.editors.findIndex((e) => e === editor);
    assert(existedTabIndex >= 0, 'editor not in this tile');

    const [removedEditor] = this.editors.splice(existedTabIndex, 1);

    assert(removedEditor);

    if (destroy) {
      removedEditor.destroy();
    }

    if (this.currentEditor === editor) {
      this.currentEditor = this.editors[existedTabIndex] || this.editors[existedTabIndex - 1];
      this.currentEditor && this.switchToEditor(this.currentEditor);
    }

    if (this.editors.length === 0) {
      this.destroy();
    }
  }

  @action.bound
  public closeAllEditors() {
    const editors = Array.from(this.editors);

    for (const editor of editors) {
      this.removeEditor(editor, true);
    }
  }

  @action
  public createEditor(entity: EditableEntityLocator, options?: { dest?: Editor | 'tile'; isActive?: boolean }) {
    if (options?.dest instanceof Editor) {
      assert(options.dest.tile === this, 'tile of target editor is not this tile');
    }

    const editableEntity = this.editableEntityManager.get(entity);
    const newEditor = editableEntity.createEditor(this);
    newEditor.isActive = Boolean(options?.isActive);

    if (options?.dest instanceof Editor) {
      // insert editor into dest's position
      const destIndex = this.editors.findIndex((editor) => editor === options.dest);

      assert(destIndex >= 0, 'dest is not in this tile');
      this.editors.splice(destIndex, 0, newEditor);
    } else if (options?.dest === 'tile') {
      this.editors.push(newEditor);
    }

    return newEditor;
  }

  @action
  public addEditorTo(editor: Editor, to?: Editor) {
    const duplicatedIndex = this.editors.findIndex(
      (e) => e !== editor && isMatch(e.entityLocator, editor.entityLocator),
    );

    if (duplicatedIndex >= 0) {
      const [duplicated] = this.editors.splice(duplicatedIndex, 1);
      duplicated!.destroy();
    }

    if (!this.editors.includes(editor)) {
      assert(editor.tile);
      editor.tile.removeEditor(editor, false);
      editor.tile = this;
    }

    const destIndex = to ? this.editors.findIndex((editor) => editor === to) : -1;
    this.editors.splice(destIndex >= 0 ? destIndex : this.editors.length, 0, editor);
  }

  @action
  public replaceOrCreateEditor(
    entity: EditableEntityLocator,
    options?: { dest?: Editor; source?: Editor['visibilityReason'] },
  ) {
    const dest = options?.dest || this.editors.find((e) => !e.isActive);

    let newEditor: Editor;

    if (dest) {
      const index = this.editors.findIndex((e) => e === dest);
      assert(index >= 0, 'can not find editor in this tile');

      newEditor = this.createEditor(entity);

      this.editors[index]!.destroy();
      this.editors[index] = newEditor;

      if (this.currentEditor === dest) {
        this.currentEditor = newEditor;
      }
    } else {
      newEditor = this.createEditor(entity, { dest: 'tile' });
      this.currentEditor = newEditor;
    }

    return newEditor;
  }

  @action
  private destroy() {
    this.emit(EventNames.Destroyed);
    this.removeAllListeners();
    this.currentEditor = undefined;
  }
}
