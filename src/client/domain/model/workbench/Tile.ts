import { action, makeObservable, observable, computed } from 'mobx';
import uniqueId from 'lodash/uniqueId';
import { Emitter } from 'strict-event-emitter';

import type Editor from 'model/abstract/Editor';
import type Manager from './TileManger';

export enum Events {
  destroyed = 'tile.destroyed',
}

export default class Tile extends Emitter<{ [Events.destroyed]: [void] }> {
  readonly id = uniqueId('tile-');
  @observable.ref currentEditor?: Editor;
  @observable.shallow editors: Editor[] = [];
  constructor(private readonly manager: Manager) {
    super();
    makeObservable(this);
  }

  @computed
  get isFocused() {
    return this.manager.focusedTile?.id === this.id;
  }

  @action.bound
  moveEditor(src: Editor, dest: Editor | 'end') {
    if (src === dest) {
      return;
    }

    const srcIndex = this.editors.findIndex((editor) => editor === src);

    if (srcIndex < 0) {
      throw new Error('can not find index');
    }

    if (dest === 'end') {
      const [item] = this.editors.splice(srcIndex, 1);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.editors.push(item!);
      return;
    }

    const destIndex = this.editors.findIndex((editor) => editor === dest);

    if (destIndex < 0) {
      throw new Error('can not find index');
    }

    const [item] = this.editors.splice(srcIndex, 1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.editors.splice(destIndex, 0, item!);
  }

  @action.bound
  addEditor(editor: Editor, destEditor?: Editor) {
    editor.tile = this;

    if (destEditor) {
      const index = this.editors.findIndex((editor) => editor === destEditor);

      if (index < 0) {
        throw new Error('wrong dest');
      }

      this.editors.splice(index, 0, editor);
    } else {
      this.editors.push(editor);
    }

    this.currentEditor = editor;
  }

  @action.bound
  switchToEditor(editorId: Editor['id'] | ((tab: Editor) => boolean)) {
    const existedTab = this.editors.find(
      typeof editorId === 'function' ? editorId : (editor) => editor.id === editorId,
    );

    if (!existedTab) {
      if (typeof editorId !== 'function') {
        throw new Error('no target tab');
      }

      return false;
    }

    this.currentEditor = existedTab;
    return true;
  }

  @action.bound
  removeEditor(editorId: Editor['id'], destroy = true) {
    const existedTabIndex = this.editors.findIndex((editor) => editor.id === editorId);

    if (existedTabIndex === -1) {
      throw new Error('no target tab');
    }

    const [closedView] = this.editors.splice(existedTabIndex, 1);

    if (destroy) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      closedView!.destroy();
    }

    if (this.currentEditor?.id === editorId) {
      this.currentEditor = this.editors[existedTabIndex] || this.editors[existedTabIndex - 1];
    }

    if (this.editors.length === 0) {
      this.destroy();
    }
  }

  @action.bound
  closeAllEditors() {
    const editorIds = this.editors.map(({ id }) => id);

    for (const id of editorIds) {
      this.removeEditor(id);
    }
  }

  private destroy() {
    this.emit(Events.destroyed);
    this.removeAllListeners();
  }
}
