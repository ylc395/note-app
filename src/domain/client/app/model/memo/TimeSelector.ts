import { action, computed, observable } from 'mobx';
import dayjs, { type Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isoWeek from 'dayjs/plugin/isoWeek';
import { createQuery } from 'mobx-tanstack-query/preset';

import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { container } from '#domain/shared/infra/singletons';
import type { Duration, MemoVO } from '#domain/shared/model/memo';
import DomainEventBus from './EventBus';

dayjs.extend(isBetween);
dayjs.extend(isoWeek);

export default class TimeSelector {
  constructor() {
    this.eventBus.on(
      [DomainEventBus.eventNames.Created, DomainEventBus.eventNames.Removed],
      this.handleMemoUpdate.bind(this),
    );
  }

  private eventBus = container.resolve(DomainEventBus);

  private readonly remote = container.resolve(rpcToken);

  private readonly now = createQuery(() => dayjs().valueOf());

  @observable.ref public accessor selectedDuration: Duration | undefined;

  public readonly recentCounts = createQuery(
    ({ signal }) => {
      return this.remote.memo.queryDates.query(this.timeParams, { signal });
    },
    {
      options: () => ({
        queryKey: ['memos', 'calendar', this.timeParams],
      }),
    },
  );

  public readonly edgeTime = createQuery(() => this.remote.memo.queryEdgeTime.query(), {
    queryKey: ['memos', 'edgeTime'],
  });

  @computed
  public get recent() {
    const today = dayjs(this.now.result.data).endOf('day');

    return {
      startTime: dayjs().subtract(11, 'week').startOf('isoWeek'),
      endTime: today,
    };
  }

  @action
  public selectDay(value: Dayjs | [Dayjs, Dayjs] | null) {
    this.selectedDuration = value
      ? {
          startTime: (Array.isArray(value) ? value[0] : value).startOf('day').valueOf(),
          endTime: (Array.isArray(value) ? value[1] : value).endOf('day').valueOf(),
        }
      : undefined;
  }

  public isFuture(day: Dayjs) {
    return day.isAfter(dayjs(this.now.result.data));
  }

  private isRecent(time: number) {
    const { startTime, endTime } = this.recent;
    return dayjs(time).isBetween(startTime, endTime, undefined, '[]');
  }

  @computed
  private get timeParams() {
    return {
      startTime: this.recent.startTime.valueOf(),
      endTime: this.recent.endTime.valueOf(),
    };
  }

  private handleMemoUpdate(memo: MemoVO) {
    this.edgeTime.invalidate();

    if (this.isRecent(memo.createdAt)) {
      this.recentCounts.invalidate();
    }
  }

  public destroy() {
    this.now.destroy();
  }
}
