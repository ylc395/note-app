import { action, makeObservable, observable } from 'mobx';
import { container } from 'tsyringe';
import uniqueId from 'lodash/uniqueId';
import { Emitter } from 'strict-event-emitter';
import assert from 'assert';

import type Editor from 'model/abstract/Editor';
import EditorManager from './EditorManager';
import { EditableEntityLocator } from 'model/entity';

type Events = {
  destroyed: [];
};

export const MAX_TILE_WIDTH = 100;
export const MIN_TILE_WIDTH = 20;

export default class Tile extends Emitter<Events> {
  readonly id = uniqueId('tile-');
  private readonly editorManager = container.resolve(EditorManager);
  @observable.ref currentEditor?: Editor;
  @observable.shallow editors: Editor[] = [];

  constructor() {
    super();
    makeObservable(this);
  }

  @action.bound
  moveEditor(src: Editor, dest?: Editor) {
    if (src === dest) {
      return;
    }

    const srcIndex = this.editors.findIndex((editor) => editor === src);

    assert(srcIndex >= 0, 'src editor is not in this tile');

    if (!dest) {
      const [item] = this.editors.splice(srcIndex, 1);
      this.editors.push(item!);
    } else {
      const destIndex = this.editors.findIndex((editor) => editor === dest);
      assert(destIndex >= 0, 'dest is not in this tile');

      const [item] = this.editors.splice(srcIndex, 1);
      this.editors.splice(destIndex, 0, item!);
    }
  }

  @action.bound
  switchToEditor(editor: Editor | ((tab: Editor) => boolean), safe?: boolean) {
    const existedTab = this.editors.find(typeof editor === 'function' ? editor : (e) => e === editor);

    if (!existedTab) {
      !safe && assert.fail('no target tab');
      return false;
    }

    this.currentEditor = existedTab;
    return true;
  }

  @action.bound
  removeEditor(editor: Editor, destroy = true) {
    const existedTabIndex = this.editors.findIndex((e) => e === editor);
    assert(existedTabIndex >= 0, 'editor not in this tile');

    const [closedEditor] = this.editors.splice(existedTabIndex, 1);

    if (destroy) {
      closedEditor!.destroy();
    }

    if (this.currentEditor === editor) {
      this.currentEditor = this.editors[existedTabIndex] || this.editors[existedTabIndex - 1];
    }

    if (this.editors.length === 0) {
      this.destroy();
    }
  }

  @action.bound
  closeAllEditors() {
    for (const editor of this.editors) {
      this.removeEditor(editor);
    }
  }

  createEditor(entity: EditableEntityLocator, dest?: Editor) {
    if (dest) {
      assert(dest.tile === this);
    }

    const newEditor = this.editorManager.createEditor(entity, this);

    if (dest) {
      const destIndex = this.editors.findIndex((editor) => editor === dest);

      assert(destIndex >= 0, 'dest is not in this tile');
      this.editors.splice(destIndex, 0, newEditor);
    } else {
      this.editors.push(newEditor);
    }

    return newEditor;
  }

  private destroy() {
    this.emit('destroyed');
    this.removeAllListeners();
  }
}
