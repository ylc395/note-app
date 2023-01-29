import EventEmitter from 'eventemitter3';
import type { MaterialVO } from 'interface/Material';
import type { NoteVO } from 'interface/Note';
import { action, makeObservable, observable, has } from 'mobx';

import MaterialEditor from './editor/MaterialEditor';
import NoteEditor from './editor/NoteEditor';

export interface Openable {
  type: 'note' | 'material';
  entity: MaterialVO | NoteVO;
}

export type Tab = {
  entityId: string;
  focused?: true;
} & (
  | {
      type: 'note';
      editor?: NoteEditor;
    }
  | {
      type: 'material';
      editor?: MaterialEditor;
    }
);

export enum Events {
  Closed = 'window.closed',
}

const TabTypeMap = {
  note: NoteEditor,
  material: MaterialEditor,
} as const;

export default class Window extends EventEmitter<Events> {
  @observable.ref currentTab?: Tab;
  @observable.shallow tabs: Tab[] = [];
  constructor(tabs?: Tab[]) {
    super();
    this.loadTabs(tabs);
    makeObservable(this);
  }

  @action
  private createTab(tab: Tab) {
    const newTab = { ...tab, editor: new TabTypeMap[tab.type](tab.entityId) } as Tab;
    this.tabs.push(newTab);

    return newTab;
  }

  @action
  private loadTabs(tabs?: Tab[]) {
    if (!tabs) {
      return;
    }

    if (tabs.length === 0) {
      throw new Error('empty tabs list');
    }

    for (const { entityId, type, focused } of tabs) {
      const tab = this.createTab({ entityId, type });

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
  open({ entity, type }: Openable) {
    const existedTab = this.tabs.find((tab) => tab.type === type && tab.entityId === entity.id);
    this.currentTab = existedTab || this.createTab({ type, entityId: entity.id });
  }

  @action.bound
  switchToTab(editorId: NonNullable<Tab['editor']>['id']) {
    const existedTab = this.tabs.find(({ editor }) => editor?.id === editorId);

    if (!existedTab) {
      throw new Error('no target tab');
    }

    this.currentTab = existedTab;
  }

  @action.bound
  closeTab(editorId: NonNullable<Tab['editor']>['id']) {
    const existedTabIndex = this.tabs.findIndex(({ editor }) => editor?.id === editorId);

    if (existedTabIndex === -1) {
      throw new Error('no target tab');
    }

    this.tabs.splice(existedTabIndex, 1);

    if (this.currentTab?.editor?.id === editorId) {
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
