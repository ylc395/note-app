import { action, observable } from 'mobx';
import dayjs, { type Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isoWeek from 'dayjs/plugin/isoWeek';
import { createQuery } from 'mobx-tanstack-query/preset';
import { isEqual, maxBy, minBy } from 'lodash-es';

import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import container from '#utils/singletonContainer';
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

  @observable private accessor isActive = false;

  private readonly eventBus = container.resolve(DomainEventBus);

  private readonly remote = container.resolve(rpcToken);

  public readonly now = createQuery(() => dayjs().valueOf(), { options: () => ({ enabled: this.isActive }) });

  @observable.ref public accessor selectedDurations: Required<Duration>[] = [];

  @observable.ref public accessor currentMonth = {
    year: dayjs(this.now.result.data).year(),
    month: dayjs(this.now.result.data).month(),
  };

  @action
  public setActive(value: boolean) {
    this.isActive = value;
  }

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
        enabled: this.isActive,
        queryKey: ['memos', 'calendar', this.currentMonth],
      }),
    },
  );

  public readonly availableRange = createQuery(() => this.remote.memo.queryAvailableDateRange.query(), {
    queryKey: ['memos', 'availableRange'],
    options: () => ({
      enabled: this.isActive,
    }),
  });

  @action
  public selectDay(value: Dayjs, mode?: 'multiple' | 'range') {
    if (mode === 'range' && this.selectedDurations.length > 0) {
      const min = minBy(this.selectedDurations, ({ startTime }) => startTime)!.startTime;
      const max = maxBy(this.selectedDurations, ({ endTime }) => endTime)!.endTime;

      this.selectedDurations = [
        {
          startTime: dayjs(min > value.valueOf() ? value.valueOf() : min)
            .startOf('day')
            .valueOf(),
          endTime: dayjs(max > value.valueOf() ? max : value.valueOf())
            .endOf('day')
            .valueOf(),
        },
      ];
    } else {
      const duration = {
        startTime: value.startOf('day').valueOf(),
        endTime: value.endOf('day').valueOf(),
      };

      if (this.selectedDurations.find((d) => isEqual(duration, d))) {
        return;
      }

      this.selectedDurations = mode === 'multiple' ? [...this.selectedDurations, duration] : [duration];
    }
  }

  @action
  public removeDate(index: number) {
    this.selectedDurations = this.selectedDurations.toSpliced(index, 1);
  }

  public isFuture(day: Dayjs) {
    return day.isAfter(dayjs(this.now.result.data));
  }

  private handleMemoUpdate(memo: MemoVO) {
    const date = dayjs(memo.createdAt);

    if (date.year() === this.currentMonth.year && date.month() === this.currentMonth.month) {
      this.dateCounts.invalidate();
    }
  }
}
