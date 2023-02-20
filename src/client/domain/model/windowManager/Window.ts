import { action, makeObservable, observable, has } from 'mobx';
import { container } from 'tsyringe';
import uniqueId from 'lodash/uniqueId';
import EventEmitter from 'eventemitter2';

import type { EntityId, EntityTypes } from 'interface/Entity';
import type NoteEditor from 'model/editor/NoteEditor';
import EditorService from 'service/EditorService';
import type Manager from './Manger';

export type OpenableEntity = {
  type: EntityTypes;
  entityId: EntityId;
};

export type Tab = {
  entityId: string;
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
  constructor(private readonly manager: Manager) {
    super();
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

  @action.bound
  moveTabTo(src: Required<Tab>, dest: Tab) {
    const srcIndex = this.tabs.findIndex((tab) => tab === src);
    this.tabs.splice(srcIndex, 1);

    const targetIndex = this.tabs.findIndex((tab) => tab === dest);
    this.tabs.splice(targetIndex + 1, 0, src);
  }

  @action.bound
  open({ entityId, type }: OpenableEntity, alwaysNewTab?: boolean) {
    const existedTab = alwaysNewTab
      ? undefined
      : this.tabs.find((tab) => tab.type === type && tab.entityId === entityId);

    this.currentTab = existedTab || this.createTab({ type, entityId });
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
    this.emit(Events.destroyed);
    this.removeAllListeners();
  }
}
