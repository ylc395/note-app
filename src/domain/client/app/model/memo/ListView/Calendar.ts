import { autorun, observable, runInAction } from 'mobx';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { container } from '#domain/shared/infra/singletons';
import type { MemoVO } from '#domain/shared/model/memo';
import { eventBus, EventNames } from '../eventBus';

dayjs.extend(isBetween);

export default class Calendar {
  constructor() {
    autorun(this.load.bind(this));
    eventBus.on([EventNames.Created, EventNames.Removed], this.handleChanged.bind(this));
  }

  @observable.ref public accessor error: unknown;

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

      runInAction(() => {
        this.data = dates;
      });
    } catch (error) {
      if (this.loadingController === newController) {
        runInAction(() => {
          this.error = error;
        });
      }
    }

    if (this.loadingController === newController) {
      this.loadingController = undefined;
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
