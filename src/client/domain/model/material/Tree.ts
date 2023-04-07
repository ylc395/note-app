import { action, makeObservable, observable } from 'mobx';
import { type DirectoryVO, type MaterialVO, isDirectory } from 'interface/material';
import { Tree, VIRTUAL_ROOT_NODE_KEY, type TreeNode, type TreeOptions } from 'model/abstract/Tree';

type Material = DirectoryVO | MaterialVO;

type MaterialTreeNode = TreeNode<Material>;

export enum SortBy {
  Title = 'title',
  UpdatedAt = 'updatedAt',
  CreatedAt = 'createdAt',
}

export enum SortOrder {
  Asc = 'asc',
  Desc = 'desc',
}

export default class MaterialTree extends Tree<Material> {
  constructor(options: TreeOptions<Material>) {
    super(options);
    makeObservable(this);
  }
  protected entityToNode(entity: Material) {
    return {
      isLeaf: !isDirectory(entity) || entity.childrenCount === 0,
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
