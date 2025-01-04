import { observable } from 'mobx';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { container } from '#domain/shared/infra/singletons';
import type { MemoVO } from '#domain/shared/model/memo';

import { eventBus as domainEventBus, EventNames as DomainEventNames } from './eventBus';

dayjs.extend(isBetween);

export default class Calendar {
  constructor() {
    domainEventBus.on([DomainEventNames.Created, DomainEventNames.Removed], this.handleChanged.bind(this));
  }

  private readonly remote = container.resolve(rpcToken);

  private loadingController?: AbortController;

  @observable public accessor data: Record<number, number> | undefined;

  @observable public accessor duration = {
    startTime: dayjs().subtract(2, 'months').startOf('month').valueOf(),
    endTime: dayjs().endOf('month').valueOf(),
  };

  public async load() {
    this.loadingController?.abort();

    const newController = new AbortController();
    this.loadingController = newController;

    try {
      const dates = await this.remote.memo.queryDates.query(this.duration, { signal: newController.signal });
      this.data = dates;
    } catch (error) {
      if (!newController.signal.aborted) {
        throw error;
      }
    } finally {
      if (this.loadingController === newController) {
        this.loadingController = undefined;
      }
    }
  }

  private handleChanged(memo: MemoVO) {
    if (dayjs(memo.createdAt).isBetween(this.duration.startTime, this.duration.endTime, 'millisecond', '[]')) {
      this.load();
    }
  }

  public reset() {
    this.loadingController?.abort();
    this.data = undefined;
  }
}
