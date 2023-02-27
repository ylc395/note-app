import { action, makeObservable, observable, computed } from 'mobx';
import uniqueId from 'lodash/uniqueId';
import EventEmitter from 'eventemitter2';

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
  moveEditorTo(src: EntityEditor, dest: EntityEditor) {
    const srcIndex = this.editors.findIndex((tab) => tab === src);
    this.editors.splice(srcIndex, 1);

    const targetIndex = this.editors.findIndex((tab) => tab === dest);
    this.editors.splice(targetIndex + 1, 0, src);
  }

  @action.bound
  addEditor(editor: EntityEditor) {
    this.editors.push(editor);
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
  closeEditor(editorId: EntityEditor['id']) {
    const existedTabIndex = this.editors.findIndex((editor) => editor.id === editorId);

    if (existedTabIndex === -1) {
      throw new Error('no target tab');
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const closedTab = this.editors.splice(existedTabIndex, 1)[0]!;

    closedTab.destroy();

    if (this.currentEditor?.id === editorId) {
      this.currentEditor = this.editors[existedTabIndex] || this.editors[existedTabIndex - 1];
    }

    if (this.editors.length === 0) {
      this.destroy();
    }
  }

  private destroy() {
    this.emit(Events.destroyed);
    this.removeAllListeners();
  }
}
