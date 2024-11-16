import { observable, runInAction } from 'mobx';

import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { container } from '#domain/shared/infra/singletons';
import eventBus, { EventNames } from './eventBus';

export default class Calendar {
  constructor() {
    eventBus.on(EventNames.Updated);
  }

  private readonly remote = container.resolve(rpcToken);

  @observable public accessor dates: Record<number, number> | undefined;

  private async load(options: { startTime: number; endTime: number }) {
    const dates = await this.remote.memo.queryDates.query(options);

    runInAction(() => {
      this.dates = dates;
    });
  }
}
