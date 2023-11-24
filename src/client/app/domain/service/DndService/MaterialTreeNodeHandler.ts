import { container } from 'tsyringe';

import Tile from 'model/workbench/Tile';
import Editor from 'model/abstract/Editor';
import Explorer from 'model/Explorer';
import MaterialService from 'service/MaterialService';

import type Handler from './Handler';
import { EntityTypes } from 'model/entity';
import { Workbench } from 'model/workbench';

export default class MaterialTreeNodeHandler implements Handler {
  private readonly explorer = container.resolve(Explorer);
  private readonly materialService = container.resolve(MaterialService);
  private readonly workbench = container.resolve(Workbench);

  private get tree() {
    return this.explorer.materialTree;
  }

  handleCancel(draggingItem: unknown) {
    if (this.tree.hasNode(draggingItem)) {
      this.tree.resetTargets();
    }
  }

  transformItem(draggingItem: unknown) {
    return this.tree.hasNode(draggingItem) && this.tree.getSelectedNodesAsTree();
  }

  handleDragStart(item: unknown) {
    if (!this.tree.hasNode(item)) {
      return;
    }

    this.tree.disableInvalidParents(this.tree.selectedNodeIds);
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

    this.tree.resetTargets();
  }
}
