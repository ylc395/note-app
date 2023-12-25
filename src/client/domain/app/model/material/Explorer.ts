import { action } from 'mobx';
import { once } from 'lodash-es';
import { singleton } from 'tsyringe';

import { isEntityMaterialVO } from '@shared/domain/model/material';
import MaterialTree from '@domain/common/model/material/Tree';
import Explorer from '@domain/app/model/abstract/Explorer';

@singleton()
export default class MaterialExplorer extends Explorer {
  public readonly tree = new MaterialTree();

  public loadRoot() {
    this.tree.root.loadChildren();
  }

  @action.bound
  public disableInvalidTargetNode() {
    for (const node of this.tree.allNodes) {
      node.isDisabled = !node.entity || isEntityMaterialVO(node.entity);
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
  }
}
