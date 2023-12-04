import { container } from 'tsyringe';

import Tile from '@domain/model/workbench/Tile';
import Editor from '@domain/model/abstract/Editor';
import Explorer from '@domain/model/Explorer';
import NoteService from '@domain/service/NoteService';

import type Handler from './Handler';
import { EntityTypes } from '@domain/model/entity';
import { Workbench } from '@domain/model/workbench';

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

    this.tree.updateValidParents(this.tree.selectedNodeIds);
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
      this.noteService.moveNotes(dropTarget === this.tree.root ? null : dropTarget.id, this.tree.selectedNodeIds);
    }

    if (dropTarget instanceof Tile || dropTarget instanceof Editor) {
      this.workbench.openEntity({ entityType: EntityTypes.Note, entityId: draggingItem.id }, dropTarget);
    }

    this.tree.resetTargets();
  }
}
