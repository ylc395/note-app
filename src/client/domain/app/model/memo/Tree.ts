import assert from 'assert';
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

  public queryChildren(): never {
    assert.fail('not implement');
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

  public getNode(id: MemoVO['id'] | null): MemoTreeNode;
  public getNode(id: MemoVO['id'] | null, safe: true): MemoTreeNode | undefined;
  public getNode(id: MemoVO['id'] | null, safe?: true) {
    return safe ? (super.getNode(id, safe) as MemoTreeNode | undefined) : (super.getNode(id) as MemoTreeNode);
  }
}
