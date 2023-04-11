import { action, makeObservable, observable } from 'mobx';
import { type MaterialVO, isDirectory } from 'interface/material';
import { Tree, TreeNode, VIRTUAL_ROOT_NODE_KEY, type TreeOptions } from 'model/abstract/Tree';

export enum SortBy {
  Title = 'title',
  UpdatedAt = 'updatedAt',
  CreatedAt = 'createdAt',
}

export enum SortOrder {
  Asc = 'asc',
  Desc = 'desc',
}

export type MaterialTreeNode = TreeNode<MaterialVO>;

export default class MaterialTree extends Tree<MaterialVO> {
  constructor(options: TreeOptions<MaterialVO>) {
    super(options);
    makeObservable(this);
  }
  protected entityToNode(entity: MaterialVO) {
    return {
      isLeaf: !isDirectory(entity) || entity.childrenCount === 0,
      title: entity.name || '未命名',
    };
  }

  @observable readonly sortOptions = {
    by: SortBy.Title,
    order: SortOrder.Asc,
  };

  @action
  sort() {
    return;
  }

  protected getEmptyEntity() {
    return {
      id: VIRTUAL_ROOT_NODE_KEY,
      name: '根目录',
      icon: null,
      parentId: null,
      childrenCount: 0,
    };
  }
}
