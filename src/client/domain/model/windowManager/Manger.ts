import { observable, makeObservable, action } from 'mobx';
import { type MosaicNode, type MosaicParent, getOtherBranch } from 'react-mosaic-component';

import Window, { Events as WindowEvents } from './Window';

export type WindowId = Window['id'];

export default class Manager {
  private readonly windowsMap = new Map<WindowId, Window>();
  @observable root?: MosaicNode<WindowId>; // a binary tree
  @observable.ref focusedWindow?: Window;

  constructor() {
    makeObservable(this);
  }

  private createWindow(focus?: true) {
    const window = new Window(this);

    window.on(WindowEvents.destroyed, () => this.removeWindow(window.id));
    this.windowsMap.set(window.id, window);

    if (focus) {
      this.focusedWindow = window;
    }

    return window;
  }

  @action.bound
  private removeWindow(windowId: WindowId) {
    this.windowsMap.delete(windowId);

    if (!this.root) {
      throw new Error('no window');
    }

    if (this.root === windowId) {
      this.root = undefined;
      return;
    }

    const searchAndRemove = (node: MosaicNode<WindowId>, parentNode?: MosaicParent<WindowId>): boolean => {
      if (typeof node === 'string') {
        return false;
      }

      if (node.first !== windowId && node.second !== windowId) {
        return searchAndRemove(node.first, node) || searchAndRemove(node.second, node);
      }

      const branchToKeep = node.first === windowId ? 'second' : 'first';
      const branchToRemove = getOtherBranch(branchToKeep);

      if (parentNode) {
        parentNode[branchToRemove] = node[branchToKeep];
      } else {
        // if parentNode is undefined, node must be root
        this.root = node[branchToKeep];
      }
      this.focusedWindow = this.get(node[branchToKeep] as string);

      return true;
    };

    if (!searchAndRemove(this.root)) {
      throw new Error('can not find window');
    }
  }

  @action.bound
  splitWindow(from: WindowId) {
    if (!this.root) {
      throw new Error('no root');
    }

    const newWindow = this.createWindow(true);

    if (this.root === from) {
      this.root = {
        direction: 'row',
        first: this.root,
        second: newWindow.id,
      };
      return newWindow;
    }

    const split = (node: MosaicNode<WindowId>, parentNode?: MosaicParent<WindowId>): boolean => {
      if (node === from) {
        if (!parentNode) {
          throw new Error('no parent');
        }

        const parentBranch = parentNode.first === node ? 'first' : 'second';
        parentNode[parentBranch] = {
          direction: 'row',
          first: parentNode[parentBranch],
          second: newWindow.id,
        };

        return true;
      } else if (typeof node !== 'string') {
        return split(node.first, node) || split(node.second, node);
      }

      return false;
    };

    if (!split(this.root)) {
      throw new Error('can not find window');
    }

    return newWindow;
  }

  get(id: WindowId, silent: true): Window | undefined;
  get(id: WindowId): Window;
  get(id: WindowId, silent?: true) {
    const window = this.windowsMap.get(id);

    if (!window && !silent) {
      throw new Error('wrong id');
    }

    return window;
  }

  @action.bound
  update(root: MosaicNode<WindowId> | null) {
    this.root = root || undefined;
  }

  getTargetWindow() {
    if (!this.root) {
      this.root = this.createWindow(true).id;
    }

    if (!this.focusedWindow) {
      throw new Error('no focusedWindow');
    }

    return this.focusedWindow;
  }
}
