import { action, computed, observable } from 'mobx';
import dayjs, { type Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isoWeek from 'dayjs/plugin/isoWeek';

import { createQuery } from 'mobx-tanstack-query/preset';

import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { container } from '#domain/shared/infra/singletons';
import type { MemoVO } from '#domain/shared/model/memo';

import DomainEventBus from './EventBus';

dayjs.extend(isBetween);
dayjs.extend(isoWeek);

export default class Calendar {
  constructor() {
    this.data = createQuery(
      ({ signal }) => {
        return this.remote.memo.queryDates.query(this.timeParams, { signal });
      },
      {
        options: () => ({
          queryKey: ['memos', 'calendar', this.timeParams],
        }),
      },
    );

    this.domainEventBus.on(
      [DomainEventBus.eventNames.Created, DomainEventBus.eventNames.Removed],
      this.handleChanged.bind(this),
    );
  }

  private readonly domainEventBus = container.resolve(DomainEventBus);

  private readonly remote = container.resolve(rpcToken);

  public readonly data;

  @observable.ref private accessor now = dayjs();

  @observable.ref public accessor selectedDuration: { startTime: number; endTime: number } | undefined;

  @computed
  public get duration() {
    const today = this.now.endOf('day');

    return {
      startTime: dayjs().subtract(11, 'week').startOf('isoWeek'),
      endTime: today,
    };
  }

  @action
  public selectDate(value: Dayjs | null) {
    this.selectedDuration = value
      ? {
          startTime: value.startOf('day').valueOf(),
          endTime: value.endOf('day').valueOf(),
        }
      : undefined;
  }

  public readonly isFuture = (day: Dayjs) => {
    return day.isAfter(this.now);
  };

  @computed
  private get timeParams() {
    return {
      startTime: this.duration.startTime.valueOf(),
      endTime: this.duration.endTime.valueOf(),
    };
  }

  private handleChanged(memo: MemoVO) {
    if (dayjs(memo.createdAt).isBetween(this.duration.startTime, this.duration.endTime, 'millisecond', '[]')) {
      this.data.refetch();
    }
  }
}
