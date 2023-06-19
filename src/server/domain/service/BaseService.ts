import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { token as databaseToken, type Database } from 'infra/database';

@Injectable()
export default class BaseService {
  constructor(@Inject(databaseToken) protected readonly db: Database, protected readonly eventEmitter: EventEmitter2) {}

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
}
