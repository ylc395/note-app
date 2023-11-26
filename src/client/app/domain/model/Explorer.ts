import { container, singleton } from 'tsyringe';

import Value from 'model/Value';
import NoteTree, { type NoteTreeNode } from 'model/note/Tree';
import MaterialTree, { type MaterialTreeNode } from 'model/material/Tree';
import { EntityTypes } from './entity';
import EditorManager, { EventNames as EditorManagerEvents } from './workbench/EditorManager';
import EditableEntity from './abstract/EditableEntity';
import EditableMaterial from './material/editable/EditableMaterial';
import { DetailedNoteVO } from 'model/note';

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

  private readonly updateTree = ({ entityType, entity }: EditableEntity) => {
    switch (entityType) {
      case EntityTypes.Note:
        return this.noteTree.updateNode({
          id: (entity as DetailedNoteVO).id,
          title: (entity as DetailedNoteVO).title,
          updatedAt: (entity as DetailedNoteVO).updatedAt,
        });
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
