import { container, singleton } from 'tsyringe';
import assert from 'assert';
import { makeObservable, observable } from 'mobx';

import Value from '@domain/model/Value';
import type { SearchableEntityType } from '@domain/model/search';

import NoteTree, { type NoteTreeNode } from './NoteTree';
import MaterialTree, { type MaterialTreeNode } from './MaterialTree';
import { EntityTypes } from '../entity';
import { EditableEntityEvents, EditableEntityManager } from '../workbench';
import type EditableEntity from '../abstract/EditableEntity';
import EditableNote from '../note/Editable';
import EditableMaterial from '../material/editable/EditableMaterial';

export type ExplorerTypes = EntityTypes.Note | EntityTypes.Material | EntityTypes.Memo;

type ExplorerTreeNode = NoteTreeNode | MaterialTreeNode;

@singleton()
export default class Explorer {
  readonly currentExplorer = new Value<ExplorerTypes>(EntityTypes.Material);
  readonly noteTree = new NoteTree();
  readonly materialTree = new MaterialTree();

  @observable.shallow
  readonly searchResultTree: Record<SearchableEntityType, null> = {
    [EntityTypes.Note]: null,
    [EntityTypes.Material]: null,
    [EntityTypes.Memo]: null,
  };

  private readonly editableEntityManager = container.resolve(EditableEntityManager);

  constructor() {
    makeObservable(this);
    this.editableEntityManager.on(EditableEntityEvents.entityUpdated, this.updateTree);
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
