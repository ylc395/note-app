import { observable, makeObservable, runInAction, action, toJS, computed } from 'mobx';
import { container, singleton } from 'tsyringe';
import assert from 'assert';
import { first, last, sortedIndexBy } from 'lodash-es';

import { token as rpcToken } from '@domain/common/infra/rpc';
import { token as storageToken } from '@domain/app/infra/localStorage';
import { memoSorter, type Duration, type MemoVO } from '@shared/domain/model/memo';
import MemoTree from '@domain/common/model/memo/Tree';
import Editor from './Editor';
import type { UpdateEvent } from './eventBus';

interface UIState {
  scrollTop?: number;
  panel?: 'editor' | 'calendar' | '';
}

@singleton()
export default class MemoList {
  private readonly remote = container.resolve(rpcToken);
  private readonly localStorage = container.resolve(storageToken);
  private tree = new MemoTree();
  public readonly newRootMemoEditor = new Editor({ onSubmit: this.add });

  constructor() {
    makeObservable(this);
  }

  @observable public isEnd = false;

  @observable.ref private duration?: Duration;

  @observable.shallow
  private readonly editors: Record<MemoVO['id'], Editor> = {};

  @observable.shallow
  private readonly childMemoEditors: Record<MemoVO['id'], Editor> = {};

  @observable
  public uiState = {
    ...{ panel: 'editor' },
    ...this.localStorage.get<UIState>('memo-ui'),
    ...{ scrollTop: 0 },
  };

  @action.bound
  public updateUIState(state: UIState) {
    Object.assign(this.uiState, state);
    this.localStorage.set('memo-ui', toJS(this.uiState));
  }

  public readonly togglePanel = (panel: 'editor' | 'calendar') => {
    this.updateUIState({ panel: this.uiState.panel === panel ? '' : panel });
  };

  @observable
  private readonly memoGroups = {
    pinned: [] as MemoVO['id'][],
    common: [] as MemoVO['id'][],
  };

  @computed
  public get memos() {
    return [...this.memoGroups.pinned, ...this.memoGroups.common];
  }

  public async load(more?: boolean) {
    if (this.isEnd || (!more && this.memoGroups.pinned.length + this.memoGroups.common.length > 0)) {
      return;
    }

    const limit = 50;
    const lastMemoId = last([...this.memoGroups.pinned, ...this.memoGroups.common]);

    const query =
      more && lastMemoId
        ? { endTime: this.get(lastMemoId).createdAt, limit, ...this.duration }
        : { limit, ...this.duration };

    const memos = await this.remote.memo.query.query(query);

    runInAction(() => {
      for (const memo of memos) {
        this.add(memo);
      }

      if (more) {
        this.isEnd = memos.length < limit;
      }
    });
  }

  public async togglePin(id: MemoVO['id']) {
    const memo = this.tree.getNode(id).entity;
    assert(memo);

    const isPinned = !memo.isPinned;
    await this.remote.memo.updateOne.mutate([id, { isPinned }]);

    runInAction(() => {
      const oldGroup = memo.isPinned ? this.memoGroups.pinned : this.memoGroups.common;
      const newGroup = memo.isPinned ? this.memoGroups.common : this.memoGroups.pinned;
      oldGroup.splice(oldGroup.indexOf(id), 1);
      newGroup.splice(
        sortedIndexBy(newGroup, id, (id) => -this.get(id).createdAt),
        0,
        id,
      );

      memo.isPinned = isPinned;
    });
  }

  @action.bound
  private add(memo: MemoVO) {
    this.tree.updateTree(memo);

    const targetGroup = memo.isPinned ? this.memoGroups.pinned : this.memoGroups.common;
    const firstId = first(targetGroup);

    if (firstId && memo.createdAt > this.get(firstId).createdAt) {
      targetGroup.unshift(memo.id);
    } else {
      targetGroup.push(memo.id);
    }
  }

  public readonly handleEntityUpdate = (e: UpdateEvent) => {
    const entity = this.tree.getNode(e.id, true)?.entity;

    if (!entity) {
      return;
    }

    this.tree.updateTree({ ...entity, ...e });
  };

  @action.bound
  public edit(id: MemoVO['id'], newChild?: boolean) {
    const editors = newChild ? this.childMemoEditors : this.editors;

    editors[id] = new Editor({
      memo: newChild ? undefined : this.get(id),
      parentId: newChild ? id : undefined,
      onSubmit: (result) => this.stopEditing(result, newChild),
      onCancel: () => this.stopEditing(id, newChild),
    });
  }

  public getEditor(id: MemoVO['id'], newChild?: boolean) {
    return newChild ? this.childMemoEditors[id] : this.editors[id];
  }

  @action.bound
  public stopEditing(memo: MemoVO | MemoVO['id'], newChild?: boolean) {
    const editors = newChild ? this.childMemoEditors : this.editors;

    if (typeof memo === 'string') {
      delete editors[memo];
    } else {
      this.tree.updateTree(memo);
      delete editors[memo.id];
    }
  }

  public get(id: MemoVO['id']) {
    const memo = this.tree.getNode(id).entity;
    assert(memo);

    return memo;
  }

  public getChildren(id: MemoVO['id']) {
    return this.tree
      .getNode(id)
      .children.map(({ entity }) => {
        assert(entity);
        return entity;
      })
      .sort(memoSorter);
  }

  public loadChildren(id: MemoVO['id']) {
    this.tree.getNode(id).loadChildren();
  }

  @action.bound
  public setDuration(duration: Duration) {
    this.duration = duration;
    this.load();
  }
}
