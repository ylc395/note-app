import { last, zipObject, flow, first } from 'lodash-es';
import assert from 'assert';
import { observable, action, runInAction } from 'mobx';

import { onlyWhen } from '#utils/function';
import type { MemoVO } from '#domain/shared/model/memo';
import { container } from '#domain/shared/infra/singletons';
import { EntityTypes } from '#domain/shared/model/entity';

import Calendar from './Calendar';
import EventBus from '../EventBus';
import Editor from '../Editor';
import List from '../../abstract/List';
import { create as createUIState, type Order } from './uiState';

export default class ListView extends List<MemoVO> {
  constructor(private readonly parent?: MemoVO) {
    const id = parent?.id ?? 'ROOT';

    super(id);
    this.uiState = createUIState(id);

    this.dispose = flow([
      this.eventBus.on(EventBus.eventNames.Updated, ({ id }) => this.init(id)),
      this.eventBus.on(EventBus.eventNames.Removed, ({ id }) => this.removeById(id)),
      this.eventBus.on(
        EventBus.eventNames.Created,
        onlyWhen(({ parentId }) => parentId === (parent?.id || null), this.add.bind(this)),
      ),
    ]);
  }

  private readonly eventBus = container.resolve(EventBus);

  public readonly uiState;

  private readonly dispose: () => void;

  private readonly calendar = container.resolve(Calendar);

  public readonly entityType = EntityTypes.Memo;

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

  protected query(signal: AbortController['signal']): Promise<MemoVO[]>;
  protected query(signal: AbortController['signal'], id: MemoVO['id']): Promise<MemoVO>;
  protected query(signal: AbortController['signal'], id?: MemoVO['id']) {
    if (id) {
      return this.remote.memo.queryOne.query(id, { signal });
    }

    return this.remote.memo.queryList.query(
      { order: this.uiState.value?.order, parentId: this.parent?.id || null, limit: ListView.LOAD_LIMIT },
      { signal },
    );
  }

  public async loadMore(params?: { direction: 'up' | 'down'; limit?: number }) {
    const lastMemo = params?.direction === 'down' ? last(this.value) : first(this.value);
    const isPinned = lastMemo?.isPinned;
    const key =
      params?.direction === 'down'
        ? this.uiState.value?.order === 'asc'
          ? 'startIndex'
          : 'endIndex'
        : this.uiState.value?.order === 'asc'
        ? 'endIndex'
        : 'startIndex';

    let memos = await this.remote.memo.queryList.query({
      order: this.uiState.value?.order,
      parentId: this.parent?.id || null,
      limit: ListView.LOAD_LIMIT,
      isPinned,
      [key]: lastMemo?.index,
    });

    if (memos.length < ListView.LOAD_LIMIT && isPinned) {
      const _memos = await this.remote.memo.queryList.query({
        order: this.uiState.value?.order,
        parentId: this.parent?.id || null,
        limit: ListView.LOAD_LIMIT - memos.length,
        isPinned: false,
        [key]: lastMemo?.index,
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
    assert(!this.parent, 'can not init on sub list');

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

  public async reveal(id: MemoVO['id']) {
    assert(!this.parent, 'only top list can reveal');

    const target = await this.remote.memo.queryOne.query(id);
    const found = target.parentId ? this.subListsMap[target.parentId]?.itemsMap[id] : this.itemsMap[id];

    if (!found) {
      runInAction(() => {
        this.itemsMap[id] = target;
      });

      await Promise.all([
        this.loadMore({ direction: 'up', limit: 15 }),
        this.loadMore({ direction: 'down', limit: 15 }),
      ]);
    }

    this.events.emit(List.eventNames.Revealed, id);
  }

  public destroy() {
    assert(this.parent, 'can not destroy top list');

    this.dispose();
    super.destroy();
  }

  private static readonly NEW_MEMO_EDITOR_ID = Symbol();
  private static readonly LOAD_LIMIT = 30;
}
