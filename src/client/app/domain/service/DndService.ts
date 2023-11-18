import { container, singleton } from 'tsyringe';
import { action, computed, makeObservable, observable } from 'mobx';

import Editor from 'model/abstract/Editor';
import type { TreeNode } from 'model/abstract/Tree';
import Explorer from 'model/Explorer';
import { EntityLocator, EntityTypes } from 'model/entity';
import Tile from 'model/workbench/Tile';
import NoteService from './NoteService';
import EditorService from './EditorService';

@singleton()
export default class DndService {
  constructor() {
    makeObservable(this);
  }

  private readonly explorer = container.resolve(Explorer);
  private readonly noteService = container.resolve(NoteService);
  private readonly editorService = container.resolve(EditorService);

  @observable.ref
  private draggingItem: unknown = null;

  @computed
  get previewingItem() {
    if (this.draggingItem instanceof Editor) {
      return this.draggingItem;
    }

    if (this.explorer.noteTree.hasNode(this.draggingItem)) {
      return this.explorer.noteTree.getSubTree();
    }

    if (this.explorer.materialTree.hasNode(this.draggingItem)) {
      return this.explorer.materialTree.getSubTree();
    }
  }

  @action.bound
  setDraggingItem(item: unknown) {
    this.draggingItem = item;

    const tree = this.explorer.queryTree(this.draggingItem);

    if (tree) {
      const treeNode = this.draggingItem as TreeNode;
      !treeNode.isSelected && tree.toggleSelect(treeNode.id, { reason: 'drag' });
      tree.disableInvalidParents(tree.selectedNodes.map((node) => node.id));
    }

    if (this.draggingItem instanceof Editor) {
      this.draggingItem.tile.switchToEditor(this.draggingItem.id);
    }
  }

  @action.bound
  cancelDragging() {
    const tree = this.explorer.queryTree(this.draggingItem);

    if (tree) {
      tree.resetTargets();
    }

    this.draggingItem = null;
  }

  private draggingItemToEntities() {
    if (this.draggingItem instanceof Editor) {
      return [this.draggingItem.editable.toEntityLocator() as EntityLocator];
    }

    if (this.explorer.noteTree.hasNode(this.draggingItem)) {
      return this.explorer.noteTree.selectedNodes.map((node) => ({ entityType: EntityTypes.Note, entityId: node.id }));
    }

    if (this.explorer.materialTree.hasNode(this.draggingItem)) {
      return this.explorer.materialTree.selectedNodes.map((node) => ({
        entityType: EntityTypes.Material,
        entityId: node.id,
      }));
    }
  }

  readonly setDropTarget = async (target: unknown) => {
    const tree = this.explorer.queryTree(target);

    if (tree) {
      const treeNode = target as TreeNode;
      const draggingEntities = this.draggingItemToEntities();

      if (!treeNode.isValidTarget || !draggingEntities) {
        return;
      }

      switch (draggingEntities[0]?.entityType) {
        case EntityTypes.Note:
          await this.noteService.moveNotes(
            treeNode.id,
            draggingEntities.map(({ entityId }) => entityId),
          );
          break;
        default:
          break;
      }
    }

    if (this.draggingItem instanceof Editor && (target instanceof Editor || target instanceof Tile)) {
      this.editorService.moveEditor(this.draggingItem, target);
    }

    this.cancelDragging();
  };
}
