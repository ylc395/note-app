import { action, computed, makeObservable } from 'mobx';
import assert from 'assert';

import { NoteVO } from '@shared/domain/model/note';
import NoteTree from '@domain/common/model/note/Tree';

export default class TargetTree extends NoteTree {
  constructor(private readonly movingNotes: NoteVO[]) {
    super();
    makeObservable(this);
  }

  protected entityToNode(note: NoteVO | null) {
    return {
      ...super.entityToNode(note),
      isDisabled: this.isDisable(note),
    };
  }

  @computed
  get targetId() {
    return this.getSelectedNodeIds(true)[0];
  }

  private isDisable(note: NoteVO | null) {
    const parentIds = this.movingNotes.map(({ parentId }) => parentId);

    if (!note) {
      return parentIds.includes(null);
    }

    const ids = this.movingNotes.map(({ id }) => id);
    if ([...parentIds, ...ids].includes(note.id)) {
      return true;
    }

    return this.getNode(note.parentId).ancestors.some((node) => node.isDisabled);
  }

  @action
  static from(tree: NoteTree) {
    const movingIds = tree.selectedNodes.map(({ entity }) => {
      assert(entity);
      return entity;
    });

    const targetTree = new TargetTree(movingIds);
    Object.assign(targetTree.root, targetTree.entityToNode(targetTree.root.entity));

    targetTree.root.loadChildren();

    return targetTree;
  }
}
