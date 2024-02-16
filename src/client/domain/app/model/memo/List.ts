import { observable, makeObservable, runInAction, computed, action, toJS } from 'mobx';
import { container, singleton } from 'tsyringe';
import assert from 'assert';
import { last } from 'lodash-es';
import { buildIndex } from '@shared/utils/collection';

import { token as rpcToken } from '@domain/common/infra/rpc';
import { token as storageToken } from '@domain/app/infra/localStorage';
import type { MemoVO } from '@shared/domain/model/memo';
import Editor from './Editor';

interface UIState {
  scrollTop?: number;
  panel?: 'editor' | 'calendar' | '';
  after?: MemoVO['id'];
}

@singleton()
export default class MemoList {
  private readonly remote = container.resolve(rpcToken);
  private readonly localStorage = container.resolve(storageToken);

  constructor() {
    makeObservable(this);
  }

  @observable public isEnd = false;

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

  @computed
  public get memos() {
    return Object.values(this.memosMap).sort((memo1, memo2) => {
      if (memo1.isPinned !== memo2.isPinned) {
        return memo1.isPinned ? -1 : 1;
      }

      return memo2.createdAt - memo1.createdAt;
    });
  }

  @observable
  private memosMap: Record<MemoVO['id'], MemoVO> = {};

  public async load(more?: boolean) {
    if (this.isEnd || (!more && this.memos.length > 0)) {
      return;
    }

    const limit = 50;
    let lastMemo = last(this.memos);

    const query = more ? { before: lastMemo?.id, limit } : { after: this.uiState.after };
    const memos = await this.remote.memo.query.query(query);

    lastMemo = last(memos);

    if (lastMemo) {
      this.updateUIState({ after: lastMemo.id });
    }

    runInAction(() => {
      if (!this.memosMap) {
        this.memosMap = {};
      }
      Object.assign(this.memosMap, buildIndex(memos));

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
      memo.isPinned = isPinned;
    });
  }

  @action.bound
  public add(memo: MemoVO) {
    assert(this.memosMap);
    this.memosMap[memo.id] = memo;
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
    this.isEnd = false;
  }
}
