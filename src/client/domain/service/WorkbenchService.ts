import { singleton } from 'tsyringe';
import { observable, makeObservable, action, computed } from 'mobx';
import uid from 'lodash/uniqueId';
import cloneDeepWith from 'lodash/cloneDeepWith';
import { type MosaicNode, getLeaves } from 'react-mosaic-component';

import Window, { type Openable, type Tab, Events as WindowEvents } from 'model/Window';
import storage from 'web/utils/storage';

const WORKBENCH_WINDOWS_KEY = 'workbench.windows';

export type WindowId = string;

const getUid = () => uid('window-');

interface PersistenceLayout {
  layout: MosaicNode<WindowId>;
  windows: Record<WindowId, Tab[]>;
  focused: WindowId;
}

@singleton()
export default class WorkbenchService {
  @observable layout?: MosaicNode<WindowId>;
  @observable.ref private currentWindowId?: WindowId;

  @computed get currentWindow() {
    return this.currentWindowId ? this.windowMap.get(this.currentWindowId) : undefined;
  }

  constructor() {
    this.loadWindows();
    makeObservable(this);
  }

  readonly windowMap = new Map<string, Window>();

  @action
  private loadWindows() {
    const layout = storage.get<PersistenceLayout>(WORKBENCH_WINDOWS_KEY);

    if (!layout) {
      return;
    }

    const { layout: oldLayout, windows, focused } = layout;
    const windowIds = getLeaves(oldLayout);
    const oldIdToNewId: Record<WindowId, WindowId> = {};

    for (const id of windowIds) {
      const [newId] = this.createWindow(windows[id]);
      oldIdToNewId[id] = newId;
    }

    this.layout =
      typeof oldLayout === 'string'
        ? oldIdToNewId[oldLayout]
        : cloneDeepWith(oldLayout, (key, value) => {
            if ((key === 'first' || key === 'second') && typeof value === 'string') {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              return oldIdToNewId[value]!;
            }
          });

    this.currentWindowId = oldIdToNewId[focused];
  }

  @action
  private createWindow(tabs?: Tab[]) {
    const windowId = getUid();
    const newWindow = new Window(tabs);
    this.windowMap.set(windowId, newWindow);

    newWindow.on(WindowEvents.Closed, () => this.closeWindow(windowId));

    return [windowId, newWindow] as const;
  }

  @action.bound
  open(entity: Openable, inNewWindow: boolean) {
    let targetWindow: Window | undefined;

    if (this.layout && !inNewWindow) {
      targetWindow = this.currentWindowId ? this.windowMap.get(this.currentWindowId) : undefined;
    } else {
      const [windowId, newWindow] = this.createWindow();

      targetWindow = newWindow;

      if (!this.layout) {
        this.layout = windowId;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.splitWindow(this.currentWindowId!, windowId);
      }

      this.currentWindowId = windowId;
    }

    if (!targetWindow) {
      throw new Error('no target window');
    }

    targetWindow.open(entity);
  }

  @action
  private splitWindow(windowId: WindowId, newWindowId: WindowId, node?: MosaicNode<WindowId>): void {
    const _node = node || this.layout;

    if (!_node) {
      throw new Error('no layout');
    }

    if (typeof _node === 'string') {
      return;
    }

    if (_node.first === windowId) {
      _node.first = { direction: 'row', first: _node.first, second: newWindowId };
      return;
    }

    if (_node.second === windowId) {
      _node.second = { direction: 'row', first: _node.second, second: newWindowId };
      return;
    }

    this.splitWindow(windowId, newWindowId, _node.first);
    this.splitWindow(windowId, newWindowId, _node.second);
  }

  @action.bound
  updateLayout(node: MosaicNode<WindowId> | null) {
    this.layout = node || undefined;
  }

  @action
  private closeWindow(windowId: WindowId, node?: MosaicNode<WindowId>, parentNode?: MosaicNode<WindowId>) {
    if (this.currentWindowId === windowId) {
      this.currentWindowId = undefined;
    }

    if (this.layout === windowId) {
      this.layout = undefined;
      this.windowMap.delete(windowId);
      return;
    }

    const _node = node || this.layout;

    if (!_node) {
      throw new Error('no layout');
    }

    if (typeof _node === 'string') {
      return;
    }

    if (_node.first !== windowId && _node.second !== windowId) {
      this.closeWindow(windowId, _node.first, _node);
      this.closeWindow(windowId, _node.second, _node);
      return;
    }

    const leftBranch = _node.first === windowId ? 'second' : 'first';

    if (!parentNode || typeof parentNode !== 'object') {
      throw new Error('no parent');
    }

    if (parentNode.first === _node) {
      parentNode.first = _node[leftBranch];
    }

    if (parentNode.second === _node) {
      parentNode.second = _node[leftBranch];
    }

    this.windowMap.delete(windowId);
  }

  destroy() {
    if (!this.currentWindowId || !this.layout) {
      return;
    }

    const windows: PersistenceLayout['windows'] = {};

    for (const [key, value] of this.windowMap.entries()) {
      windows[key] = value.tabs.map((tab) => ({
        entityId: tab.entityId,
        type: tab.type,
        ...(tab === value.currentTab ? { focused: true } : null),
      }));
    }

    storage.set<PersistenceLayout>(WORKBENCH_WINDOWS_KEY, {
      focused: this.currentWindowId,
      layout: this.layout,
      windows,
    });
  }
}
