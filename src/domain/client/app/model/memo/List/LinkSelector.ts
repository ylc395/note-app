import { createQuery } from 'mobx-tanstack-query/preset';
import { action, observable } from 'mobx';

import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import DomainEventBus from '../EventBus';
import type { ClientMemoQuery } from '#domain/shared/model/memo';

export default class LinkSelector {
  constructor() {
    this.eventBus.on([DomainEventBus.eventNames.Created, DomainEventBus.eventNames.Removed], () =>
      this.linkSetQuery.invalidate(),
    );
  }

  private readonly eventBus = container.resolve(DomainEventBus);

  private readonly remote = container.resolve(rpcToken);

  public readonly linkSetQuery = createQuery(() => this.remote.memo.queryLinkSet.query(), {
    queryKey: ['memos', 'linkSet'],
  });

  @observable public accessor params: ClientMemoQuery['links'];

  @action.bound
  public update(value: Partial<NonNullable<ClientMemoQuery['links']>>, append?: boolean) {
    if (!append) {
      this.params = value;
      return;
    }
  }
}
