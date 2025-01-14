import { observable } from 'mobx';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { createQuery } from 'mobx-tanstack-query/preset';

import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { container } from '#domain/shared/infra/singletons';
import type { MemoVO } from '#domain/shared/model/memo';

import DomainEventBus from './EventBus';

dayjs.extend(isBetween);

export default class Calendar {
  constructor() {
    this.data = createQuery(
      () => {
        return this.remote.memo.queryDates.query(this.duration);
      },
      { queryKey: ['memos', 'calendar'] },
    );

    this.domainEventBus.on(
      [DomainEventBus.eventNames.Created, DomainEventBus.eventNames.Removed],
      this.handleChanged.bind(this),
    );
  }

  private readonly domainEventBus = container.resolve(DomainEventBus);

  private readonly remote = container.resolve(rpcToken);

  public readonly data;

  @observable public accessor duration = {
    startTime: dayjs().subtract(2, 'months').startOf('month').valueOf(),
    endTime: dayjs().endOf('month').valueOf(),
  };

  private handleChanged(memo: MemoVO) {
    if (dayjs(memo.createdAt).isBetween(this.duration.startTime, this.duration.endTime, 'millisecond', '[]')) {
      this.data.refetch();
    }
  }
}
