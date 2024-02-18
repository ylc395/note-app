import { observable, makeObservable, runInAction, action, toJS, computed } from 'mobx';
import { container, singleton } from 'tsyringe';
import assert from 'assert';
import { first, last, sortedIndexBy } from 'lodash-es';

import { token as rpcToken } from '@domain/common/infra/rpc';
import { token as storageToken } from '@domain/app/infra/localStorage';
import type { Duration, MemoVO } from '@shared/domain/model/memo';
import Editor from './Editor';

interface UIState {
  scrollTop?: number;
  panel?: 'editor' | 'calendar' | '';
  after?: MemoVO['createdAt'];
}

@singleton()
export default class MemoList {
  private readonly remote = container.resolve(rpcToken);
  private readonly localStorage = container.resolve(storageToken);

  constructor() {
    makeObservable(this);
  }

  @observable public isEnd = false;

  @observable.ref private duration?: Duration;

  @observable.shallow
  private readonly editors: Record<MemoVO['id'], Editor> = {};

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

  private memosMap: Record<MemoVO['id'], MemoVO> = {};

  public async load(more?: boolean) {
    if (this.isEnd || (!more && this.memoGroups.pinned.length + this.memoGroups.common.length > 0)) {
      return;
    }

    const limit = 50;
    const lastMemoId = last([...this.memoGroups.pinned, ...this.memoGroups.common]);

    const query =
      more && lastMemoId
        ? { endTime: this.get(lastMemoId).createdAt, limit, ...this.duration }
        : { startTime: this.uiState.after, ...this.duration };

    const memos = await this.remote.memo.query.query(query);
    const lastMemo = last(memos);

    if (lastMemo) {
      this.updateUIState({ after: lastMemo.createdAt });
    }

    runInAction(() => {
      for (const memo of memos) {
        this.add(memo);
      }

      if (more) {
        this.isEnd = memos.length < limit;
      }
    });
  }

  public async toggleMemoPin(id: MemoVO['id']) {
    const memo = this.memosMap[id];
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
  public add(memo: MemoVO) {
    this.memosMap[memo.id] = observable(memo);
    const targetGroup = memo.isPinned ? this.memoGroups.pinned : this.memoGroups.common;
    const firstId = first(targetGroup);

    if (firstId && memo.createdAt > this.get(firstId).createdAt) {
      targetGroup.unshift(memo.id);
    } else {
      targetGroup.push(memo.id);
    }
  }

  @action.bound
  public edit(id: MemoVO['id']) {
    this.editors[id] = new Editor({
      memo: this.get(id),
      onSubmit: this.stopEditing,
    });
  }

  public getEditor(id: MemoVO['id']) {
    return this.editors[id];
  }

  @action.bound
  public stopEditing(memo: MemoVO | MemoVO['id']) {
    if (typeof memo !== 'string') {
      this.memosMap[memo.id] = memo;
      delete this.editors[memo.id];
    } else {
      delete this.editors[memo];
    }
  }

  public get(id: MemoVO['id']) {
    const memo = this.memosMap[id];
    assert(memo);

    return memo;
  }

  @action
  public reset() {
    this.memosMap = {};
    this.memoGroups.common = [];
    this.memoGroups.pinned = [];
    this.isEnd = false;
  }

  @action.bound
  public setDuration(duration: Duration) {
    this.duration = duration;
    this.reset();
    this.load();
  }
}
