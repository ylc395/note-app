import { action, makeObservable, observable, computed } from 'mobx';
import uniqueId from 'lodash/uniqueId';
import EventEmitter from 'eventemitter3';

import type EntityEditor from 'model/abstract/Editor';
import type Manager from './TileManger';

export enum Events {
  destroyed = 'tile.destroyed',
}

export default class Tile extends EventEmitter {
  readonly id = uniqueId('tile-');
  @observable.ref currentEditor?: EntityEditor;
  @observable.shallow editors: EntityEditor[] = [];
  constructor(private readonly manager: Manager) {
    super();
    makeObservable(this);
  }

  get isRoot() {
    return this.manager.root === this.id;
  }

  @computed
  get isFocused() {
    return this.manager.focusedTile?.id === this.id;
  }

  @action.bound
  moveEditor(src: EntityEditor, dest: EntityEditor | 'end') {
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
  addEditor(editor: EntityEditor, destEditor?: EntityEditor) {
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
  switchToEditor(editorId: EntityEditor['id'] | ((tab: EntityEditor) => boolean)) {
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
  closeEditor(editorId: EntityEditor['id'], destroy = true) {
    const existedTabIndex = this.editors.findIndex((editor) => editor.id === editorId);

    if (existedTabIndex === -1) {
      throw new Error('no target tab');
    }

    const [closedTab] = this.editors.splice(existedTabIndex, 1);

    if (destroy) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      closedTab!.destroy();
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
      this.closeEditor(id);
    }
  }

  private destroy() {
    this.emit(Events.destroyed);
    this.removeAllListeners();
  }
}
