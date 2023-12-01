import { container } from 'tsyringe';
import assert from 'assert';

import Editor from 'model/abstract/Editor';
import { Workbench } from 'model/workbench';
import Handler from './Handler';

export default class EditorHandler implements Handler {
  private readonly workbench = container.resolve(Workbench);
  handleDrop(draggingItem: unknown, dropTarget: unknown) {
    if (draggingItem instanceof Editor && dropTarget instanceof Editor) {
      this.workbench.moveEditor(draggingItem, dropTarget);
    }
  }

  handleDragStart(draggingItem: unknown): void {
    if (draggingItem instanceof Editor) {
      assert(draggingItem.tile);
      draggingItem.tile.switchToEditor(draggingItem);
    }
  }
}
