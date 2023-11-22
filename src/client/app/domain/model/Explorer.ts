import { container, singleton } from 'tsyringe';

import Value from 'model/Value';
import NoteTree, { type NoteTreeNode } from 'model/note/Tree';
import MaterialTree, { type MaterialTreeNode } from 'model/material/Tree';
import { EntityTypes } from './entity';
import EditorManager from './workbench/EditorManager';
import EditableEntity from './abstract/EditableEntity';
import type EditableNote from './note/Editable';
import EditableMaterial from './material/editable/EditableMaterial';

export enum ExplorerTypes {
  Materials = 'materials',
  Notes = 'notes',
  Memo = 'memo',
}

type ExplorerTreeNode = NoteTreeNode | MaterialTreeNode;

@singleton()
export default class Explorer {
  readonly currentExplorer = new Value(ExplorerTypes.Materials);
  readonly noteTree = new NoteTree();
  readonly materialTree = new MaterialTree();

  private readonly editorManager = container.resolve(EditorManager);

  constructor() {
    this.editorManager.on('entityUpdated', this.updateTree);
  }

  private readonly updateTree = ({ entityType, entity }: EditableEntity) => {
    switch (entityType) {
      case EntityTypes.Note:
        return this.noteTree.updateTree((entity as EditableNote['entity'])!.metadata);
      case EntityTypes.Material:
        return this.materialTree.updateTree((entity as EditableMaterial['entity'])!.metadata);
      default:
        break;
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
