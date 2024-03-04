import { runInAction, makeObservable, computed, observable } from 'mobx';

import TreeNode from '@domain/common/model/abstract/TreeNode';
import type { MemoVO } from '@shared/domain/model/memo';
import type MemoTree from './Tree';

export default class MemoTreeNode extends TreeNode<MemoVO> {
  constructor(params: { entity: MemoVO | null; tree: MemoTree }) {
    super(params);
    makeObservable(this);
  }

  @observable
  public readonly isEnd = { after: false, before: false };

  protected fetchChildren() {
    return this.remote.memo.query.query({ parentId: this.isRoot ? null : this.id });
  }

  public async loadChildren(direction?: 'after' | 'before') {
    if (this.isLoading || (this.isLoaded && !direction) || (direction && this.isEnd[direction])) {
      return;
    }

    runInAction(() => {
      this.isLoading = true;
    });

    if (!direction) {
      await this.initChildren();
    } else {
      const memos = await this.remote.memo.query.query({
        limit: MemoTreeNode.LIMIT,
        parentId: this.isRoot ? null : this.id,
        [direction]: this.memos.findLast((memo) => !memo.isPinned)?.id,
      });

      runInAction(() => {
        if (memos.length < MemoTreeNode.LIMIT) {
          this.isEnd[direction] = true;
        }

        this.tree.updateTree(memos);
      });
    }

    runInAction(() => {
      this.isLoading = false;
    });
  }

  private async initChildren() {
    const parentId = this.isRoot ? null : this.id;
    const [pinnedMemos, memos] = await Promise.all([
      this.remote.memo.query.query({ isPinned: true, parentId }),
      this.remote.memo.query.query({ limit: MemoTreeNode.LIMIT, parentId }),
    ]);

    runInAction(() => {
      this.tree.updateTree([...pinnedMemos, ...memos]);
      this.isLoaded = true;
      this.isEnd.after = true;

      if (memos.length < MemoTreeNode.LIMIT) {
        this.isEnd.before = true;
      }
    });
  }

  @computed
  public get memos() {
    return this.children
      .map((node) => node.entity!)
      .sort((memo1, memo2) => {
        if (memo1.isPinned !== memo2.isPinned) {
          return memo1.isPinned ? -1 : 1;
        }

        return this.isRoot ? memo2.createdAt - memo1.createdAt : memo1.createdAt - memo2.createdAt;
      });
  }

  private static readonly LIMIT = 30;
}
