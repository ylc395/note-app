import { last, zipObject, flow } from 'lodash-es';
import assert from 'assert';
import { observable, action, runInAction } from 'mobx';

import type { MemoVO } from '#domain/shared/model/memo';
import { container } from '#domain/shared/infra/singletons';

import Calendar from './Calendar';
import { eventBus, EventNames } from '../eventBus';
import UIState from '../../abstract/UIState';
import Editor from '../Editor';
import List from '../../abstract/List';
import { onlyWhen } from '#utils/function';

export type Order = 'asc' | 'desc';

interface ListViewUIState {
  scrollTop: number;
  order: Order;

  /* 一级列表有以下值 */
  calendar: boolean;
}

export default class ListView extends List<MemoVO> {
  constructor(private readonly parent?: MemoVO) {
    super();
    this.uiState = new UIState(`UI_STATE_MEMO_LIST-${this.parent?.id ?? 'ROOT'}`);

    this.dispose = flow([
      eventBus.on(EventNames.Updated, ({ id }) => this.init(id)),
      eventBus.on(EventNames.Removed, ({ id }) => this.removeById(id)),
      eventBus.on(
        EventNames.Created,
        onlyWhen(({ parentId }) => parentId === (parent?.id || null), this.add.bind(this)),
      ),
    ]);
  }

  private readonly dispose: () => void;
  private readonly calendar = container.resolve(Calendar);
  public readonly uiState: UIState<ListViewUIState>;
  @observable.shallow public accessor memos: MemoVO[] | undefined;
  @observable.shallow public accessor editorsMap: Record<MemoVO['id'] | symbol, Editor> = {};
  @observable.shallow private accessor subListsMap: Record<MemoVO['id'], ListView> = {};

  protected readonly sort = (item1: MemoVO, item2: MemoVO) => {
    return (item1.index - item2.index) * (this.uiState.value?.order === 'asc' ? 1 : -1);
  };

  @action.bound
  public setOrder(order: Order) {
    this.uiState.update({ order });
  }

  @action.bound
  public toggleCalendar() {
    assert(!this.parent, 'can not toggle calendar on sub list');
    const isVisible = !this.uiState.value?.calendar;

    this.uiState.update({ calendar: isVisible });

    if (isVisible) {
      this.calendar.load();
    } else {
      this.calendar.reset();
    }
  }

  protected load(signal: AbortController['signal']): Promise<MemoVO[]>;
  protected load(signal: AbortController['signal'], id: MemoVO['id']): Promise<MemoVO>;
  protected load(signal: AbortController['signal'], id?: MemoVO['id']) {
    if (id) {
      return this.remote.memo.queryOne.query(id, { signal });
    }

    return this.remote.memo.queryList.query(
      { order: this.uiState.value?.order, parentId: this.parent?.id || null, limit: ListView.LOAD_LIMIT },
      { signal },
    );
  }

  public async loadMore() {
    const lastMemo = last(this.value);
    const isPinned = lastMemo?.isPinned;

    let memos = await this.remote.memo.queryList.query({
      order: this.uiState.value?.order,
      parentId: this.parent?.id || null,
      limit: ListView.LOAD_LIMIT,
      isPinned,
      [this.uiState.value?.order === 'asc' ? 'startIndex' : 'endIndex']: lastMemo?.index,
    });

    if (memos.length < ListView.LOAD_LIMIT && isPinned) {
      const _memos = await this.remote.memo.queryList.query({
        order: this.uiState.value?.order,
        parentId: this.parent?.id || null,
        limit: ListView.LOAD_LIMIT - memos.length,
        isPinned: false,
        [this.uiState.value?.order === 'asc' ? 'startIndex' : 'endIndex']: lastMemo?.index,
      });

      memos = memos.concat(_memos);
    }

    runInAction(() => {
      this.itemsMap = {
        ...this.itemsMap,
        ...zipObject(
          memos.map(({ id }) => id),
          memos,
        ),
      };
    });
  }

  @action.bound
  public initSubList(memo: MemoVO) {
    assert(memo.childrenCount > 0, 'can not init empty children');
    const newList = new ListView(memo);

    this.subListsMap[memo.id] = newList;
  }

  public getSubList(id: MemoVO['id']) {
    return this.subListsMap[id];
  }

  public removeSubList(id: MemoVO['id']) {
    delete this.subListsMap[id];
  }

  public initEditor(memo?: MemoVO) {
    assert(!memo || this.memos?.includes(memo), 'invalid memo');

    const id = memo?.id || ListView.NEW_MEMO_EDITOR_ID;

    this.editorsMap[id] = new Editor({
      memo,
      parentId: memo ? undefined : this.parent?.id || null,
      onDestroyed: this.removeEditor.bind(this, id),
    });
  }

  public getEditor(id: MemoVO['id']) {
    return this.editorsMap[id];
  }

  @action
  private removeEditor(id: MemoVO['id'] | symbol) {
    delete this.editorsMap[id];
  }

  public destroy() {
    this.dispose();
    super.destroy();
  }

  private static readonly NEW_MEMO_EDITOR_ID = Symbol();
  private static readonly LOAD_LIMIT = 30;
}
