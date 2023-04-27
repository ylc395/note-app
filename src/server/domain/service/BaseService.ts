import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { token as databaseToken, type Database } from 'infra/Database';
import { token as downloaderToken, type Downloader } from 'infra/Downloader';
import { token as appClientToken, type AppClient } from 'infra/AppClient';
import type Repositories from './repository';

@Injectable()
export default class BaseService implements Repositories {
  private readonly transactionManager: Database['transactionManager'];

  constructor(
    @Inject(databaseToken) private readonly db: Database,
    @Inject(downloaderToken) protected readonly downloader: Downloader,
    @Inject(appClientToken) protected readonly appClient: AppClient,
    protected readonly eventEmitter: EventEmitter2,
  ) {
    this.transactionManager = this.db.transactionManager;
  }

  protected async transaction<T>(cb: () => Promise<T>): Promise<T> {
    const trx = await this.transactionManager.start();
    return await this.transactionManager.run(trx, async () => {
      try {
        const result = await cb();
        await this.transactionManager.commit();
        return result;
      } catch (error) {
        await this.transactionManager.rollback();
        throw error;
      }
    });
  }

  get notes() {
    return this.db.getRepository('notes');
  }

  get recyclables() {
    return this.db.getRepository('recyclables');
  }

  get stars() {
    return this.db.getRepository('stars');
  }

  get resources() {
    return this.db.getRepository('resources');
  }

  get memos() {
    return this.db.getRepository('memos');
  }

  get materials() {
    return this.db.getRepository('materials');
  }

  get revisions() {
    return this.db.getRepository('revisions');
  }

  get synchronization() {
    return this.db.getRepository('synchronization');
  }
}
