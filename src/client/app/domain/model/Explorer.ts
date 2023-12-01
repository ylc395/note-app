import { container, singleton } from 'tsyringe';
import assert from 'assert';

import Value from 'model/Value';
import NoteTree, { type NoteTreeNode } from 'model/note/Tree';
import MaterialTree, { type MaterialTreeNode } from 'model/material/Tree';
import { EntityTypes } from './entity';
import EditorManager, { EventNames as EditorManagerEvents } from './workbench/EditorManager';
import type EditableEntity from './abstract/EditableEntity';
import EditableNote from './note/Editable';
import EditableMaterial from './material/editable/EditableMaterial';

export type ExplorerTypes = EntityTypes.Note | EntityTypes.Material | EntityTypes.Memo;

type ExplorerTreeNode = NoteTreeNode | MaterialTreeNode;

@singleton()
export default class Explorer {
  readonly currentExplorer = new Value<ExplorerTypes>(EntityTypes.Material);
  readonly noteTree = new NoteTree();
  readonly materialTree = new MaterialTree();

  private readonly editorManager = container.resolve(EditorManager);

  constructor() {
    this.editorManager.on(EditorManagerEvents.entityUpdated, this.updateTree);
  }

  private readonly updateTree = (editable: EditableEntity) => {
    assert(editable.entity);

    if (editable instanceof EditableNote) {
      return this.noteTree.updateNode(editable.entity);
    }

    if (editable instanceof EditableMaterial) {
      return this.materialTree.updateTree(editable.entity);
    }
  };

  isTreeNode(item: unknown): item is ExplorerTreeNode {
    return this.noteTree.hasNode(item) || this.materialTree.hasNode(item);
  }

  treeNodeToEntityLocator(node: ExplorerTreeNode) {
    return {
      entityId: node.id,
      entityType: this.noteTree.hasNode(node) ? EntityTypes.Note : EntityTypes.Material,
    } as const;
  }
}
