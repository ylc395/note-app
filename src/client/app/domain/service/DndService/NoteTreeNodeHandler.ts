import { container } from 'tsyringe';

import Tile from 'model/workbench/Tile';
import Editor from 'model/abstract/Editor';
import Explorer from 'model/Explorer';
import NoteService from 'service/NoteService';

import type Handler from './Handler';
import { EntityTypes } from 'model/entity';
import { Workbench } from 'model/workbench';

export default class NoteTreeNodeHandler implements Handler {
  private readonly explorer = container.resolve(Explorer);
  private readonly noteService = container.resolve(NoteService);
  private readonly workbench = container.resolve(Workbench);
  private get tree() {
    return this.explorer.noteTree;
  }

  handleDragStart(item: unknown): void {
    if (!this.tree.hasNode(item)) {
      return;
    }

    if (!item.isSelected) {
      this.tree.toggleSelect(item.id, { reason: 'drag' });
    }

    this.tree.disableInvalidParents(this.tree.selectedNodeIds);
  }

  handleCancel(draggingItem: unknown) {
    if (this.tree.hasNode(draggingItem)) {
      this.tree.resetTargets();
    }
  }

  transformItem(draggingItem: unknown) {
    return this.tree.hasNode(draggingItem) && this.tree.getSelectedNodesAsTree();
  }

  handleDrop(draggingItem: unknown, dropTarget: unknown) {
    if (!this.tree.hasNode(draggingItem)) {
      return;
    }

    if (this.tree.hasNode(dropTarget) && dropTarget.isValidTarget) {
      this.noteService.moveNotes(dropTarget.id, this.tree.selectedNodeIds);
    }

    if (dropTarget instanceof Tile || dropTarget instanceof Editor) {
      this.workbench.openEntity({ entityType: EntityTypes.Note, entityId: draggingItem.id }, dropTarget);
    }

    this.tree.resetTargets();
  }
}
