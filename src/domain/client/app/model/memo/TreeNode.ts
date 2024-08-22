import { makeObservable, observable, action, reaction, runInAction } from 'mobx';
import { container } from 'tsyringe';
import { first, last } from 'lodash-es';
import assert from 'assert';

import type { MemoVO } from '@domain/shared/model/memo';
import { token } from '@domain/client/common/infra/rpc';
import Editor from './Editor';
import type MemoExplorer from './Explorer';
import { buildIndex } from '@utils/collection';

export default class MemoTreeNode {
  private readonly remote = container.resolve(token);
  @observable.ref public newChildEditor?: Editor;
  @observable.ref public editor?: Editor;
  @observable.shallow private children: MemoTreeNode[] = [];
  @observable public isExpanded: boolean;
  @observable public isLoaded = { up: false, down: false };
  @observable public memo?: MemoVO;
  @observable.ref public readonly explorer: MemoExplorer;

  constructor({ memo, explorer }: { memo?: MemoVO; explorer: MemoExplorer }) {
    this.memo = memo;
    this.explorer = explorer;

    if (memo) {
      this.isExpanded = false;
      this.explorer.nodesMap[memo.id] = this;
    } else {
      this.isExpanded = true;
    }

    makeObservable(this);
    reaction(() => this.explorer.order, this.load.bind(this, 'down', true));
  }

  @action.bound
  public startEditing() {
    assert(this.memo, 'can not edit root node');
    this.editor = new Editor({
      memo: this.memo,
      onSubmit: this.stopEditing,
      onCancel: this.stopEditing,
    });
  }

  @action.bound
  private stopEditing(memo?: MemoVO) {
    this.editor = undefined;

    if (memo) {
      this.memo = memo;
    }
  }

  @action.bound
  public startEditingNewChild(initial?: string) {
    this.newChildEditor = new Editor({
      initial,
      parentId: this.memo?.id,
      onCancel: this.stopEditingNewChild,
      onSubmit: action((memo) => {
        this.children?.push(new MemoTreeNode({ memo, explorer: this.explorer }));

        if (this.memo) {
          this.memo.childrenCount += 1;
        }

        this.startEditingNewChild();
      }),
    });
  }

  @action.bound
  private stopEditingNewChild() {
    this.newChildEditor = undefined;
  }

  @action.bound
  public toggleExpand() {
    assert(!this.isRoot, 'can not expand a root');
    this.isExpanded = !this.isExpanded;

    if (this.isExpanded) {
      this.load();
      this.startEditingNewChild();
    } else {
      this.stopEditingNewChild();
      this.resetChildren();
    }
  }

  @action.bound
  public togglePinned() {
    assert(this.memo);
    this.memo.isPinned = !this.memo.isPinned;
  }

  private get isRoot() {
    return !this.memo;
  }

  public get isLeaf() {
    return Boolean(this.memo?.parentId);
  }

  public get sortedChildren() {
    return this.children.toSorted(({ memo: memo1 }, { memo: memo2 }) => {
      assert(memo1 && memo2);

      if (memo1.isPinned !== memo2.isPinned) {
        return Number(memo2.isPinned) - Number(memo1.isPinned);
      }

      return (memo1.createdAt - memo2.createdAt) * (this.explorer.order === 'desc' || this.isRoot ? -1 : 1);
    });
  }

  @action
  private resetChildren() {
    for (const { memo } of this.children) {
      assert(memo);
      delete this.explorer.nodesMap[memo.id];
    }

    this.isLoaded.up = false;
    this.isLoaded.down = false;
    this.children = [];
  }

  public async load(direction: 'up' | 'down' = 'down', reset = false) {
    if ((!this.isExpanded || this.isLoaded[direction]) && !reset) {
      return;
    }

    if (reset) {
      this.resetChildren();
    }

    const primaryPinnedType = direction === 'down';
    const baseNode = direction === 'up' ? first(this.sortedChildren) : last(this.sortedChildren);
    const filterKey =
      (direction === 'down' && this.explorer.order === 'desc') || (direction === 'up' && this.explorer.order === 'asc')
        ? 'before'
        : 'after';

    let memos: MemoVO[] = [];

    if (baseNode?.memo?.isPinned === primaryPinnedType) {
      memos = await this.remote.memo.queryList.query({
        [filterKey]: baseNode?.memo?.id || null,
        isPinned: primaryPinnedType,
        parentId: this.memo?.id,
        limit: MemoTreeNode.LIMIT,
      });
    }

    if (memos.length < MemoTreeNode.LIMIT) {
      const secondaryMemos = await this.remote.memo.queryList.query({
        isPinned: !primaryPinnedType,
        [filterKey]: baseNode?.memo?.id || null,
        parentId: this.memo?.id,
        limit: MemoTreeNode.LIMIT - memos.length,
      });

      memos = memos.concat(secondaryMemos);
    }

    runInAction(() => {
      if (memos.length < MemoTreeNode.LIMIT) {
        this.isLoaded[direction] = true;
      }

      this.children.push(...memos.map((memo) => new MemoTreeNode({ memo, explorer: this.explorer })));
    });
  }

  private static readonly LIMIT = 30;

  public static from(memos: MemoVO[], explorer: MemoExplorer) {
    const root = new MemoTreeNode({ explorer });
    const nodes = memos.map((memo) => new MemoTreeNode({ memo, explorer }));
    const map = buildIndex(nodes);

    for (const node of nodes) {
      assert(node.memo);
      map[node.memo.id]?.children.push(node);
    }

    root.children.push(...nodes.filter((node) => !node.memo));

    return root;
  }
}
