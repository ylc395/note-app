import { NoteVO } from '@domain/model/note';
import NoteTree, { NoteTreeNode } from '@shared/domain/model/note/Tree';
import { runInAction } from 'mobx';

export type { NoteTreeNode } from '@shared/domain/model/note/Tree';

export default class ExplorerNoteTree extends NoteTree {
  constructor(private movingIds?: (NoteTreeNode['id'] | null)[]) {
    super();
  }

  updateValidParentTargets() {
    for (const id of this.selectedNodeIds) {
      const node = this.getNode(id);

      node.isDisabled = true;
      node.parent!.isDisabled = true;

      for (const descendant of this.getDescendants(id)) {
        descendant.isDisabled = true;
      }
    }
  }

  protected entityToNode(note: NoteVO) {
    return { ...super.entityToNode(note), isDisabled: this.isDisable(note) };
  }

  private isDisable(note: NoteVO | null) {
    if (!this.movingIds) {
      return false;
    }

    let nodeId: string | undefined = (note || this.root).id;
    const parentIdOfMovingNote = this.movingIds.map((id) => this.getNode(id, true)?.parent?.id);

    if (parentIdOfMovingNote.includes(nodeId)) {
      return true;
    }

    while (nodeId) {
      if (this.movingIds.includes(nodeId)) {
        return true;
      }

      nodeId = this.getNode(nodeId, true)?.parent?.id;
    }

    return false;
  }

  getSelectedNodesAsTree() {
    const tree = new ExplorerNoteTree();

    runInAction(() => {
      tree.root.children = this.selectedNodes.map((node) => ({
        ...node,
        children: [],
        isSelected: false,
        isLeaf: true,
        isExpanded: false,
      }));
    });

    return tree;
  }
}
