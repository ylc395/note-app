import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { token as databaseToken, type Database } from 'infra/database';
import type Repositories from './repository';

@Injectable()
export default class BaseService implements Repositories {
  constructor(@Inject(databaseToken) private readonly db: Database, protected readonly eventEmitter: EventEmitter2) {}

  protected async transaction<T>(cb: () => Promise<T>): Promise<T> {
    const trx = await this.db.transactionManager.start();
    return await this.db.transactionManager.run(trx, async () => {
      try {
        const result = await cb();
        await this.db.transactionManager.commit();
        return result;
      } catch (error) {
        await this.db.transactionManager.rollback();
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
