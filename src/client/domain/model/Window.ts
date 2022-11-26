import EventEmitter from 'eventemitter3';
import type { MaterialVO } from 'interface/Material';
import { action, makeObservable, observable, has } from 'mobx';

import MaterialEditor from './editor/MaterialEditor';

type Tab = MaterialEditor;
export type Openable = MaterialVO;
export type TabVO = { type: 'material'; id: MaterialVO['id']; focused?: true };

export enum Events {
  Closed = 'window.closed',
}

export default class Window extends EventEmitter<Events> {
  @observable.ref currentTab?: Tab;
  @observable.shallow tabs: Tab[] = [];
  constructor(tabs?: TabVO[]) {
    super();
    this.loadTabs(tabs);
    makeObservable(this);
  }

  @action
  private createTab(tab: TabVO) {
    let editor: MaterialEditor;

    if (tab.type === 'material') {
      editor = new MaterialEditor(tab.id);
    } else {
      throw new Error('unknown type');
    }

    this.tabs.push(editor);

    return editor;
  }

  @action
  private loadTabs(tabs?: TabVO[]) {
    if (!tabs) {
      return;
    }

    if (tabs.length === 0) {
      throw new Error('empty tabs list');
    }

    for (const { id, type, focused } of tabs) {
      const tab = this.createTab({ id, type });

      if (focused) {
        this.currentTab = tab;
      }
    }
  }

  @action.bound
  moveTabTo(src: Tab, dest: Tab) {
    const srcIndex = this.tabs.findIndex((tab) => tab === src);
    this.tabs.splice(srcIndex, 1);

    const targetIndex = this.tabs.findIndex((tab) => tab === dest);
    this.tabs.splice(targetIndex + 1, 0, src);
  }

  @action.bound
  open(entity: Openable) {
    const existedTab = this.tabs.find((tab) => tab.materialId === entity.id);

    this.currentTab = existedTab || this.createTab({ type: 'material', id: entity.id });
  }

  @action.bound
  switchToTab(tabId: Tab['id']) {
    const existedTab = this.tabs.find(({ id }) => id === tabId);

    if (!existedTab) {
      throw new Error('no target tab');
    }

    this.currentTab = existedTab;
  }

  @action.bound
  closeTab(tabId: Tab['id']) {
    const existedTabIndex = this.tabs.findIndex(({ id }) => id === tabId);

    if (existedTabIndex === -1) {
      throw new Error('no target tab');
    }

    this.tabs.splice(existedTabIndex, 1);

    if (this.currentTab?.id === tabId) {
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
    this.emit(Events.Closed);
    this.removeAllListeners();
  }
}
