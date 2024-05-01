import type { MaterialVO } from '@domain/shared/model/material';
import { EntityTypes } from '@domain/shared/model/entity';
import Tree from '../abstract/Tree';
import MaterialTreeNode from './TreeNode';

export default class MaterialTree extends Tree<MaterialVO> {
  public readonly entityType = EntityTypes.Material;

  protected createNode(entity: MaterialVO | null): MaterialTreeNode {
    return new MaterialTreeNode({ tree: this, entity });
  }

  public queryChildren(id: MaterialVO['parentId'] | MaterialVO['id'][]) {
    return this.remote.material.query.query({ parentId: id });
  }
}
