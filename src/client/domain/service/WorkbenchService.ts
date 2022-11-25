import { singleton } from 'tsyringe';
import { observable, makeObservable, action } from 'mobx';
import uid from 'lodash/uniqueId';
import cloneDeepWith from 'lodash/cloneDeepWith';
import { type MosaicNode, getLeaves } from 'react-mosaic-component';

import Window, { type Openable, type TabVO } from 'model/Window';
import storage from 'web/utils/storage';

const WORKBENCH_WINDOWS_KEY = 'workbench.windows';

export type WindowId = string;

const getUid = () => uid('window-');

interface LayoutVO {
  layout: MosaicNode<WindowId>;
  windows: Record<WindowId, TabVO[]>;
  focused: WindowId;
}

@singleton()
export default class WorkbenchService {
  @observable layout?: MosaicNode<WindowId>;
  @observable.ref currentWindowId?: WindowId;
  constructor() {
    this.loadWindows();
    makeObservable(this);
  }

  readonly windowMap = new Map<string, Window>();

  @action
  private loadWindows() {
    const layout = storage.get<LayoutVO>(WORKBENCH_WINDOWS_KEY);

    if (!layout) {
      return;
    }

    const { layout: oldLayout, windows, focused } = layout;
    const windowIds = getLeaves(oldLayout);
    const oldIdToNewId: Record<WindowId, WindowId> = {};

    for (const id of windowIds) {
      const newId = getUid();
      oldIdToNewId[id] = newId;
      this.windowMap.set(newId, new Window(windows[id]));
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

  @action.bound
  open(entity: Openable, inNewWindow: boolean) {
    let targetWindow: Window | undefined;

    if (this.layout && !inNewWindow) {
      targetWindow = this.currentWindowId ? this.windowMap.get(this.currentWindowId) : undefined;
    } else {
      const windowId = getUid();
      targetWindow = new Window();
      this.windowMap.set(windowId, targetWindow);

      if (!this.layout) {
        this.layout = windowId;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.splitWindow(this.currentWindowId!);
      }

      this.currentWindowId = windowId;
    }

    if (!targetWindow) {
      throw new Error('no target window');
    }

    targetWindow.open(entity);
  }

  @action
  private splitWindow(windowId: WindowId, node?: MosaicNode<WindowId>): void {
    if (!this.layout) {
      throw new Error('no layout');
    }

    const _node = node || this.layout;

    if (typeof _node === 'string') {
      return;
    }

    if (_node.first === windowId) {
      _node.first = { direction: 'row', first: _node.first, second: windowId };
      return;
    }

    if (_node.second === windowId) {
      _node.second = { direction: 'row', first: _node.second, second: windowId };
      return;
    }

    this.splitWindow(windowId, _node.first);
    this.splitWindow(windowId, _node.second);
  }

  @action.bound
  updateLayout(node: MosaicNode<WindowId> | null) {
    this.layout = node || undefined;
  }

  destroy() {
    if (!this.currentWindowId || !this.layout) {
      return;
    }

    const windows: LayoutVO['windows'] = {};

    for (const [key, value] of this.windowMap.entries()) {
      windows[key] = value.tabs.map((tab) => ({
        id: tab.materialId,
        type: 'material',
        ...(tab === value.currentTab ? { focused: true } : null),
      }));
    }

    storage.set<LayoutVO>(WORKBENCH_WINDOWS_KEY, {
      focused: this.currentWindowId,
      layout: this.layout,
      windows,
    });
  }
}
