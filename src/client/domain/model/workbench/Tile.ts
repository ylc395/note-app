import { action, makeObservable, observable, computed } from 'mobx';
import uniqueId from 'lodash/uniqueId';
import { Emitter } from 'strict-event-emitter';

import type EntityEditor from 'model/abstract/Editor';
import type Manager from './TileManger';
import type EditorView from 'model/abstract/EditorView';

export enum Events {
  destroyed = 'tile.destroyed',
}

export default class Tile extends Emitter<{ [Events.destroyed]: [void] }> {
  readonly id = uniqueId('tile-');
  @observable.ref currentEditorView?: EditorView;
  @observable.shallow editorViews: EditorView[] = [];
  constructor(private readonly manager: Manager) {
    super();
    makeObservable(this);
  }

  @computed
  get isFocused() {
    return this.manager.focusedTile?.id === this.id;
  }

  @action.bound
  moveEditorView(src: EditorView, dest: EditorView | 'end') {
    if (src === dest) {
      return;
    }

    const srcIndex = this.editorViews.findIndex((editor) => editor === src);

    if (srcIndex < 0) {
      throw new Error('can not find index');
    }

    if (dest === 'end') {
      const [item] = this.editorViews.splice(srcIndex, 1);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.editorViews.push(item!);
      return;
    }

    const destIndex = this.editorViews.findIndex((editor) => editor === dest);

    if (destIndex < 0) {
      throw new Error('can not find index');
    }

    const [item] = this.editorViews.splice(srcIndex, 1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.editorViews.splice(destIndex, 0, item!);
  }

  @action.bound
  addEditorView(editorView: EditorView, destEditorView?: EditorView) {
    editorView.tile = this;

    if (destEditorView) {
      const index = this.editorViews.findIndex((editor) => editor === destEditorView);

      if (index < 0) {
        throw new Error('wrong dest');
      }

      this.editorViews.splice(index, 0, editorView);
    } else {
      this.editorViews.push(editorView);
    }

    this.currentEditorView = editorView;
  }

  @action.bound
  switchToEditorView(editorViewId: EditorView['id'] | ((tab: EditorView) => boolean)) {
    const existedTab = this.editorViews.find(
      typeof editorViewId === 'function' ? editorViewId : (editorView) => editorView.id === editorViewId,
    );

    if (!existedTab) {
      if (typeof editorViewId !== 'function') {
        throw new Error('no target tab');
      }

      return false;
    }

    this.currentEditorView = existedTab;
    return true;
  }

  @action.bound
  removeEditorView(editorViewId: EditorView['id'], destroy = true) {
    const existedTabIndex = this.editorViews.findIndex((editor) => editor.id === editorViewId);

    if (existedTabIndex === -1) {
      throw new Error('no target tab');
    }

    const [closedView] = this.editorViews.splice(existedTabIndex, 1);

    if (destroy) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      closedView!.destroy();
    }

    if (this.currentEditorView?.id === editorViewId) {
      this.currentEditorView = this.editorViews[existedTabIndex] || this.editorViews[existedTabIndex - 1];
    }

    if (this.editorViews.length === 0) {
      this.destroy();
    }
  }

  @action.bound
  closeAllEditorViews() {
    const editorIds = this.editorViews.map(({ id }) => id);

    for (const id of editorIds) {
      this.removeEditorView(id);
    }
  }

  private destroy() {
    this.emit(Events.destroyed);
    this.removeAllListeners();
  }
}
