import { container } from 'tsyringe';

import Tile from '@domain/model/workbench/Tile';
import Editor from '@domain/model/abstract/Editor';
import Explorer from '@domain/model/Explorer';
import MaterialService from '@domain/service/MaterialService';

import type Handler from './Handler';
import { EntityTypes } from '@domain/model/entity';
import { Workbench } from '@domain/model/workbench';

export default class MaterialTreeNodeHandler implements Handler {
  private readonly explorer = container.resolve(Explorer);
  private readonly materialService = container.resolve(MaterialService);
  private readonly workbench = container.resolve(Workbench);

  private get tree() {
    return this.explorer.materialTree;
  }

  handleCancel(draggingItem: unknown) {
    if (this.tree.hasNode(draggingItem)) {
      this.tree.resetDisabled();
    }
  }

  transformItem(draggingItem: unknown) {
    return this.tree.hasNode(draggingItem) && this.tree.getSelectedNodesAsTree();
  }

  handleDragStart(item: unknown) {
    if (!this.tree.hasNode(item)) {
      return;
    }

    this.tree.updateValidParentTargets();
  }

  handleDrop(draggingItem: unknown, dropTarget: unknown) {
    if (!this.tree.hasNode(draggingItem)) {
      return;
    }

    if (this.tree.hasNode(dropTarget)) {
      // todo
    }

    if (dropTarget instanceof Tile || dropTarget instanceof Editor) {
      this.workbench.openEntity({ entityType: EntityTypes.Note, entityId: draggingItem.id }, dropTarget);
    }

    this.tree.resetDisabled();
  }
}
