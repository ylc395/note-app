import type { Duration, MemoVO } from '@shared/domain/model/memo';
import { EntityTypes } from '@shared/domain/model/entity';
import Tree from '@domain/common/model/abstract/Tree';
import MemoTreeNode from './TreeNode';

export default class MemoTree extends Tree<MemoVO> {
  constructor() {
    super();
  }

  public readonly entityType = EntityTypes.Memo;
  public root = this.createNode(null);
  public entityToNode(memo: MemoVO) {
    return { isLeaf: memo.childrenCount === 0 };
  }

  protected createNode(memo: MemoVO | null) {
    return new MemoTreeNode({ entity: memo, tree: this });
  }

  public async fetchChildren(parentId: MemoVO['parentId']) {
    const memos = await this.remote.memo.query.query({ parentId });
    return memos;
  }

  public readonly loadByTime = async (duration: Duration) => {
    const memos = await this.remote.memo.query.query(duration);
    this.updateTree(memos);
  };
}
