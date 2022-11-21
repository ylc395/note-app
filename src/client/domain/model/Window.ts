import type { MaterialVO } from 'interface/Material';
import { action, makeObservable, observable } from 'mobx';
import uid from 'lodash/uniqueId';

import MaterialEditor from './editor/MaterialEditor';

type Tab = MaterialEditor;
export type Openable = MaterialVO;

export default class Window {
  id = uid('window-');
  @observable.ref currentTab?: Tab;
  @observable.shallow tabs: Tab[] = [];
  constructor() {
    makeObservable(this);
  }

  @action.bound
  createTab(entity: Openable) {
    const tab = new MaterialEditor(entity);
    this.tabs.push(tab);

    return tab;
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
    const existedTab = this.tabs
      .filter((tab) => tab instanceof MaterialEditor)
      .find((tab) => tab.materialId === entity.id);

    this.currentTab = existedTab || this.createTab(entity);
  }
}
