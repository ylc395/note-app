import { container, singleton } from 'tsyringe';
import { action, computed, makeObservable, observable } from 'mobx';
import assert from 'assert';

import type { default as Handler, DragMoveEvent } from './Handler';
import NoteTreeNodeHandler from './NoteTreeNodeHandler';
import MaterialTreeNodeHandler from './MaterialTreeNodeHandler';
import TileHandler from './TileHandler';
import EditorHandler from './EditorHandler';

@singleton()
export default class DndService {
  private handlers: Handler[] = [
    new NoteTreeNodeHandler(),
    new MaterialTreeNodeHandler(),
    new EditorHandler(),
    container.resolve(TileHandler),
  ];

  @observable.ref
  private draggingItem?: unknown;

  constructor() {
    makeObservable(this);
  }

  @observable.ref
  overItem?: unknown;

  @computed
  get previewingItem() {
    if (!this.draggingItem) {
      return;
    }

    for (const handler of this.handlers) {
      const item = handler.transformItem?.(this.draggingItem);

      if (item) {
        return item as unknown;
      }
    }

    return this.draggingItem;
  }

  getHandler<T>(token: { new (...args: unknown[]): T }): T {
    for (const handler of this.handlers) {
      if (handler instanceof token) {
        return handler;
      }
    }

    assert.fail('invalid token');
  }

  @action.bound
  setDraggingItem(item: unknown) {
    this.draggingItem = item;
    this.handlers.forEach((handler) => handler.handleDragStart?.(item));
  }

  @action.bound
  cancelDragging() {
    this.handlers.forEach((handler) => handler.handleCancel?.(this.draggingItem));
    this.draggingItem = undefined;
    this.overItem = undefined;
  }

  @action.bound
  setDropTarget(target: unknown) {
    this.handlers.forEach((handler) => handler.handleDrop?.(this.draggingItem, target));

    this.draggingItem = undefined;
    this.overItem = undefined;
  }

  @action.bound
  handleDragOver(over: unknown) {
    this.overItem = over;
    this.handlers.forEach((handler) => handler.handleDragOver?.(this.draggingItem, over));
  }

  readonly handleDragMove = (over: unknown, event: DragMoveEvent) => {
    this.handlers.forEach((handler) => handler.handleDragMove?.(this.draggingItem, over, event));
  };
}
