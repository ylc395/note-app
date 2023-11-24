import { container } from 'tsyringe';

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
}
