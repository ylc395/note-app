import type { MemoVO } from '@shared/domain/model/memo';
import { EntityTypes } from '@shared/domain/model/entity';

import type TreeNode from '../abstract/TreeNode';
import Tree from '../abstract/Tree';

export type MemoTreeNode = TreeNode<MemoVO>;

export default class MemoTree extends Tree<MemoVO> {
  public readonly entityType = EntityTypes.Memo;
  public async fetchChildren(parentId: MemoVO['parentId']) {
    const notes = await this.remote.memo.query.query({ parentId });
    return notes;
  }

  protected queryFragments = undefined;
  public entityToNode = undefined;
}
