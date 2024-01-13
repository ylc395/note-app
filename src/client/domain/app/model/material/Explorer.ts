import { action, makeObservable } from 'mobx';
import { singleton } from 'tsyringe';
import assert from 'assert';

import { isEntityMaterial } from '@shared/domain/model/material';
import MaterialTree from '@domain/common/model/material/Tree';
import Explorer from '@domain/app/model/abstract/Explorer';
import EditableMaterial from './editable/EditableMaterial';
import EditableEntity from '../abstract/EditableEntity';

@singleton()
export default class MaterialExplorer extends Explorer {
  constructor() {
    super('materialExplorer');
    makeObservable(this);
  }
  public readonly tree = new MaterialTree();

  public load() {
    this.tree.root.loadChildren();
  }

  private readonly handleEntityUpdated = (editableEntity: EditableEntity) => {
    if (!(editableEntity instanceof EditableMaterial)) {
      return;
    }

    const node = this.tree.getNode(editableEntity.entityId, true);

    if (node) {
      assert(node.entity);
      this.tree.updateTree({ ...node.entity, ...editableEntity.entity });
    }
  };

  @action.bound
  public updateTreeForDropping() {
    for (const node of this.tree.allNodes) {
      node.isDisabled = !node.entity || isEntityMaterial(node.entity);
    }

    for (const node of this.tree.selectedNodes) {
      if (node.isDisabled) {
        continue;
      }

      node.isDisabled = false;
      node.parent!.isDisabled = false;

      for (const descendant of node.descendants) {
        descendant.isDisabled = false;
      }
    }

    this.status = 'toDrop';
  }
}
