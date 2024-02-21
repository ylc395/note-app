import { action, makeObservable, observable } from 'mobx';
import { container } from 'tsyringe';
import { uniqueId, isMatch } from 'lodash-es';
import assert from 'assert';

import Editor from '@domain/app/model/abstract/Editor';
import type { EditableEntityLocator } from '@domain/app/model/abstract/EditableEntity';
import EditableEntityManager from './EditableEntityManager';
import { eventBus, EventNames } from './eventBus';
import type { EntityLocator } from '../entity';

export enum SwitchReasons {
  HistoryBack,
  HistoryForward,
}

export default class Tile {
  constructor() {
    makeObservable(this);
  }

  public readonly id = uniqueId('tile-');
  private readonly editableEntityManager = container.resolve(EditableEntityManager);

  @observable.ref
  public currentEditor?: Editor;

  @observable.shallow
  public editors: Editor[] = [];

  public findByEntity({ entityId, entityType }: EntityLocator) {
    return this.editors.find((e) => isMatch(e.entityLocator, { entityId, entityType }));
  }

  @action.bound
  public switchToEditor(editor: Editor | EditableEntityLocator, reason?: SwitchReasons) {
    const existedTab = editor instanceof Editor ? this.editors.find((e) => editor === e) : this.findByEntity(editor);

    if (!existedTab) {
      return false;
    }

    this.currentEditor = existedTab;
    eventBus.emit(EventNames.EditorSwitched, [this.currentEditor, reason]);
    return true;
  }

  @action.bound
  public removeEditor(editor: Editor, destroy = true) {
    const existedTabIndex = this.editors.findIndex((e) => e === editor);
    assert(existedTabIndex >= 0, 'editor not in this tile');

    const [removedEditor] = this.editors.splice(existedTabIndex, 1);

    assert(removedEditor);

    if (destroy) {
      this.editableEntityManager.destroyEditor(removedEditor);
    }

    if (this.currentEditor === editor) {
      this.currentEditor = this.editors[existedTabIndex] || this.editors[existedTabIndex - 1];
      this.currentEditor && this.switchToEditor(this.currentEditor);
    }

    if (this.editors.length === 0) {
      this.empty();
    }
  }

  @action.bound
  public closeAllEditors() {
    for (const editor of this.editors) {
      this.editableEntityManager.destroyEditor(editor);
    }

    this.empty();
    this.editors = [];
  }

  @action
  public createEditor(entity: EditableEntityLocator, options?: { dest?: Editor | 'tile'; isActive?: boolean }) {
    if (options?.dest instanceof Editor) {
      assert(options.dest.tile === this, 'tile of target editor is not this tile');
    }

    const newEditor = this.editableEntityManager.createEditor(this, entity);

    if (options?.isActive) {
      newEditor.setActive();
    }

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
      this.editableEntityManager.destroyEditor(duplicated!);
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
  public replaceOrCreateEditor(entity: EditableEntityLocator, dest?: Editor) {
    dest = dest || this.editors.find((e) => !e.isActive);

    let newEditor: Editor;

    if (dest) {
      const index = this.editors.findIndex((e) => e === dest);
      assert(index >= 0, 'can not find editor in this tile');

      newEditor = this.createEditor(entity);

      this.editableEntityManager.destroyEditor(this.editors[index]!);
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
  private empty() {
    eventBus.emit(EventNames.TileEmptied, this);
    this.currentEditor = undefined;
  }
}
