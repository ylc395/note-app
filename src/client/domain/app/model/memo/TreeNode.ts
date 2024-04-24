import { makeObservable, observable, action, reaction, computed, runInAction } from 'mobx';
import { container } from 'tsyringe';
import { first, last } from 'lodash-es';
import assert from 'assert';

import type { MemoVO } from '@shared/domain/model/memo';
import { token } from '@domain/common/infra/rpc';
import Editor from './Editor';
import type MemoExplorer from './Explorer';
import { buildIndex } from '@shared/utils/collection';

export default class MemoTreeNode {
  private readonly remote = container.resolve(token);
  @observable.ref public newChildEditor?: Editor;
  @observable.ref public editor?: Editor;
  @observable.shallow private children: MemoTreeNode[] = [];
  @observable public isExpanded: boolean;
  @observable public isLoaded = { up: false, down: false };
  @observable public memo?: MemoVO;
  @observable.ref public readonly explorer: MemoExplorer;

  @computed
  public get isChild() {
    return Boolean(this.memo?.parentId);
  }

  constructor({ memo, explorer }: { memo?: MemoVO; explorer: MemoExplorer }) {
    this.memo = memo;
    this.explorer = explorer;

    if (!memo) {
      this.isExpanded = true;
      this.initChildEditor();
    } else {
      this.isExpanded = false;
    }

    makeObservable(this);
    reaction(() => this.explorer.order, this.load.bind(this, 'down', true));
  }

  @action.bound
  public startEditing() {
    assert(this.memo, 'can not edit root node');
    this.editor = new Editor({ parentId: this.memo.id, onSubmit: this.stopEditing });
  }

  @action.bound
  public stopEditing(memo?: MemoVO) {
    this.editor = undefined;

    if (memo) {
      this.memo = memo;
    }
  }

  @action
  private initChildEditor() {
    this.newChildEditor = new Editor({
      memo: this.memo,
      onSubmit: action((memo) => {
        this.initChildEditor();
        this.children?.push(new MemoTreeNode({ memo, explorer: this.explorer }));

        if (this.memo) {
          this.memo.childrenCount += 1;
        }
      }),
    });
  }

  @action.bound
  public toggleExpand() {
    this.isExpanded = !this.isExpanded;

    if (this.isExpanded) {
      this.initChildEditor();
      this.load();
    } else {
      this.children = [];

      if (!this.newChildEditor?.isDirty) {
        this.newChildEditor = undefined;
      }
    }
  }

  @action.bound
  public togglePinned() {
    assert(this.memo);
    this.memo.isPinned = !this.memo.isPinned;
  }

  public get isRoot() {
    return Boolean(this.memo);
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

  public async load(direction: 'up' | 'down' = 'down', reset = false) {
    if (!this.isExpanded || this.isLoaded[direction]) {
      return;
    }

    if (reset) {
      runInAction(() => {
        this.isLoaded.up = false;
        this.isLoaded.down = false;
        this.children = [];
      });
    }

    const primaryPinnedType = direction === 'down';
    const baseNode = direction === 'up' ? first(this.sortedChildren) : last(this.sortedChildren);
    const filterKey =
      (direction === 'down' && this.explorer.order === 'desc') || (direction === 'up' && this.explorer.order === 'asc')
        ? 'before'
        : 'after';

    let memos: MemoVO[] = [];

    if (baseNode?.memo?.isPinned === primaryPinnedType) {
      memos = await this.remote.memo.query.query({
        [filterKey]: baseNode?.memo?.id || null,
        isPinned: primaryPinnedType,
        limit: MemoTreeNode.LIMIT,
      });
    }

    if (memos.length < MemoTreeNode.LIMIT) {
      const secondaryMemos = await this.remote.memo.query.query({
        isPinned: !primaryPinnedType,
        [filterKey]: baseNode?.memo?.id || null,
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
