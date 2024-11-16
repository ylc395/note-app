import { autorun, observable, runInAction } from 'mobx';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { container } from '#domain/shared/infra/singletons';
import { eventBus, EventNames } from './eventBus';
import type { MemoVO } from '#domain/shared/model/memo';

dayjs.extend(isBetween);

export default class Calendar {
  constructor() {
    autorun(this.load.bind(this));
    eventBus.on([EventNames.Created, EventNames.Removed], this.handleChanged.bind(this));
  }

  private readonly remote = container.resolve(rpcToken);

  @observable public accessor data: Record<number, number> | undefined;

  @observable public accessor duration = {
    startTime: dayjs().subtract(2, 'months').startOf('month').valueOf(),
    endTime: dayjs().endOf('month').valueOf(),
  };

  private async load() {
    const dates = await this.remote.memo.queryDates.query(this.duration);

    runInAction(() => {
      this.data = dates;
    });
  }

  private handleChanged(memo: MemoVO) {
    if (dayjs(memo.createdAt).isBetween(this.duration.startTime, this.duration.endTime, 'millisecond', '[]')) {
      this.load();
    }
  }
}
