import TreeNode from '../abstract/TreeNode';
import type { MaterialVO } from '@shared/domain/model/material';

export default class MaterialTreeNode extends TreeNode<MaterialVO> {
  protected fetchChildren() {
    return this.remote.material.query.query({ parentId: this.isRoot ? null : this.id });
  }
}
