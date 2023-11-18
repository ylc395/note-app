import { singleton } from 'tsyringe';

import Value from 'model/Value';
import NoteTree, { type NoteTreeNode } from 'model/note/Tree';
import MaterialTree, { type MaterialTreeNode } from 'model/material/Tree';

export enum ExplorerTypes {
  Materials = 'materials',
  Notes = 'notes',
  Memo = 'memo',
}

@singleton()
export default class Explorer {
  readonly currentExplorer = new Value(ExplorerTypes.Materials);
  readonly noteTree = new NoteTree();
  readonly materialTree = new MaterialTree();

  queryTree(node: unknown) {
    if (this.noteTree.hasNode(node)) {
      return this.noteTree;
    }

    if (this.materialTree.hasNode(node)) {
      return this.materialTree;
    }

    return null;
  }

  isNode(node: unknown): node is MaterialTreeNode | NoteTreeNode {
    return this.noteTree.hasNode(node) || this.materialTree.hasNode(node);
  }
}
