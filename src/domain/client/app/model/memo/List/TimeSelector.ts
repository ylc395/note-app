import { action, observable } from 'mobx';
import dayjs, { type Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isoWeek from 'dayjs/plugin/isoWeek';
import { createQuery } from 'mobx-tanstack-query/preset';

import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { container } from '#domain/shared/infra/singletons';
import type { Duration, MemoVO } from '#domain/shared/model/memo';
import DomainEventBus from '../EventBus';

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

  @observable.ref public accessor selectedDuration: Required<Duration> | undefined;

  @observable.ref public accessor currentMonth = {
    year: dayjs(this.now.result.data).year(),
    month: dayjs(this.now.result.data).month(),
  };

  public readonly dateCounts = createQuery(
    ({ signal }) => {
      const monthDate = new Date(this.currentMonth.year, this.currentMonth.month);

      return this.remote.memo.queryDates.query(
        { startTime: dayjs(monthDate).valueOf(), endTime: dayjs(monthDate).endOf('month').valueOf() },
        { signal },
      );
    },
    {
      options: () => ({
        queryKey: ['memos', 'calendar', this.currentMonth],
      }),
    },
  );

  public readonly availableRange = createQuery(() => this.remote.memo.queryAvailableDateRange.query(), {
    queryKey: ['memos', 'availableRange'],
  });

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

  private handleMemoUpdate(memo: MemoVO) {
    this.availableRange.invalidate();

    const date = dayjs(memo.createdAt);

    if (date.year() === this.currentMonth.year && date.month() === this.currentMonth.month) {
      this.dateCounts.invalidate();
    }
  }
}
