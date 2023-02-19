import { action, makeObservable, observable, has } from 'mobx';
import { container } from 'tsyringe';
import uniqueId from 'lodash/uniqueId';
import EventEmitter from 'eventemitter2';

import type { EntityTypes } from 'interface/Entity';
import type { NoteVO } from 'interface/Note';
import type NoteEditor from 'model/editor/NoteEditor';
import EditorService from 'service/EditorService';
import type Manager from './Manger';

export type OpenableEntity = {
  type: EntityTypes.Note;
  entity: NoteVO;
};

export type Tab = {
  entityId: string;
  focused: boolean;
} & {
  type: EntityTypes.Note;
  editor?: NoteEditor;
};

export enum Events {
  destroyed = 'window.destroyed',
}

export default class Window extends EventEmitter {
  readonly id = uniqueId('window-');
  @observable.ref currentTab?: Required<Tab>;
  @observable.shallow tabs: Required<Tab>[] = [];
  private readonly editorService = container.resolve(EditorService);
  constructor(private readonly manager: Manager, tabs?: Tab[]) {
    super();
    this.loadTabs(tabs);
    makeObservable(this);
  }

  get isRoot() {
    return this.manager.root === this.id;
  }

  @action
  private createTab(tab: Tab) {
    const newTab = { ...tab, editor: this.editorService.createEditor(this, tab.type, tab.entityId) } as Required<Tab>;
    this.tabs.push(newTab);

    return newTab;
  }

  @action
  private loadTabs(tabs?: Tab[]) {
    if (!tabs) {
      return;
    }

    for (const { entityId, type, focused } of tabs) {
      const tab = this.createTab({ entityId, type, focused });

      if (focused) {
        this.currentTab = tab;
      }
    }
  }

  @action.bound
  moveTabTo(src: Required<Tab>, dest: Tab) {
    const srcIndex = this.tabs.findIndex((tab) => tab === src);
    this.tabs.splice(srcIndex, 1);

    const targetIndex = this.tabs.findIndex((tab) => tab === dest);
    this.tabs.splice(targetIndex + 1, 0, src);
  }

  @action.bound
  open({ entity, type }: OpenableEntity, alwaysNewTab?: boolean) {
    const existedTab = alwaysNewTab
      ? undefined
      : this.tabs.find((tab) => tab.type === type && tab.entityId === entity.id);

    this.currentTab = existedTab || this.createTab({ type, entityId: entity.id, focused: true });
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

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const closedTab = this.tabs.splice(existedTabIndex, 1)[0]!;

    closedTab.editor.destroy();

    if (this.currentTab?.editor.id === editorId) {
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
    if (this.isRoot) {
      return;
    }

    this.emit(Events.destroyed);
    this.removeAllListeners();
  }
}
