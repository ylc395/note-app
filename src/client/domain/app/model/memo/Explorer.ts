import { observable, makeObservable, action, toJS, runInAction } from 'mobx';
import { container, singleton } from 'tsyringe';
import { once } from 'lodash-es';

import { token as rpcToken } from '@domain/common/infra/rpc';
import { token as storageToken } from '@domain/app/infra/localStorage';
import type { Duration, MemoVO } from '@shared/domain/model/memo';
import { EntityTypes } from '../entity';
import MemoTreeNode from './TreeNode';

interface UIState {
  scrollTop?: number;
  panel?: 'editor' | 'calendar' | '';
}

export type Order = 'asc' | 'desc';

@singleton()
export default class MemoExplorer {
  private readonly remote = container.resolve(rpcToken);
  public readonly entityType = EntityTypes.Memo;
  private readonly localStorage = container.resolve(storageToken);
  @observable public order: Order = 'desc'; // only work for children nodes

  @action.bound
  public setOrder(order: Order) {
    this.order = order;
  }

  @observable.ref
  public root = new MemoTreeNode({ explorer: this });

  constructor() {
    makeObservable(this);
  }

  @observable.ref
  public duration?: Duration;

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

  public readonly init = once(() => {
    this.root.load();
  });

  public async reveal(id: MemoVO['id']) {
    const memos = await this.remote.memo.queryTreeFragment.query({ to: id, limit: 15 });

    runInAction(() => {
      this.root = MemoTreeNode.from(memos, this);
    });
  }
}
