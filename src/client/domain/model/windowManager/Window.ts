import { action, makeObservable, observable, has, computed } from 'mobx';
import uniqueId from 'lodash/uniqueId';
import EventEmitter from 'eventemitter2';

import type EntityEditor from 'model/editor/EntityEditor';
import type Manager from './Manger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Tab = EntityEditor<any>;

export enum Events {
  destroyed = 'window.destroyed',
}

export default class Window extends EventEmitter {
  readonly id = uniqueId('window-');
  @observable.ref currentTab?: Tab;
  @observable.shallow tabs: Tab[] = [];
  constructor(private readonly manager: Manager) {
    super();
    makeObservable(this);
  }

  get isRoot() {
    return this.manager.root === this.id;
  }

  @computed
  get isFocused() {
    return this.manager.focusedWindow?.id === this.id;
  }

  @action.bound
  moveTabTo(src: Tab, dest: Tab) {
    const srcIndex = this.tabs.findIndex((tab) => tab === src);
    this.tabs.splice(srcIndex, 1);

    const targetIndex = this.tabs.findIndex((tab) => tab === dest);
    this.tabs.splice(targetIndex + 1, 0, src);
  }

  @action.bound
  createTab(tab: Tab) {
    this.tabs.push(tab);
    this.currentTab = tab;
  }

  @action.bound
  switchToTab(editorId: Tab['id']) {
    const existedTab = this.tabs.find((editor) => editor.id === editorId);

    if (!existedTab) {
      throw new Error('no target tab');
    }

    this.currentTab = existedTab;
  }

  @action.bound
  closeTab(editorId: Tab['id']) {
    const existedTabIndex = this.tabs.findIndex((editor) => editor.id === editorId);

    if (existedTabIndex === -1) {
      throw new Error('no target tab');
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const closedTab = this.tabs.splice(existedTabIndex, 1)[0]!;

    closedTab.destroy();

    if (this.currentTab?.id === editorId) {
      this.currentTab =
        (has(this.tabs, String(existedTabIndex)) && this.tabs[existedTabIndex]) ||
        (has(this.tabs, String(existedTabIndex)) && this.tabs[existedTabIndex - 1]) ||
        undefined;
    }

    if (this.tabs.length === 0) {
      this.destroy();
    }
  }

  private destroy() {
    this.emit(Events.destroyed);
    this.removeAllListeners();
  }
}
