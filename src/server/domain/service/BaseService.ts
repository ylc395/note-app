import { Inject } from '@nestjs/common';

import { token as databaseToken, type Database } from 'infra/database';
import { token as eventBusToken, type EventBus } from 'infra/eventBus';
import { type default as Runtime, token as runtimeToken } from 'infra/Runtime';
import type Repositories from './repository';

export default abstract class BaseService {
  constructor(
    @Inject(runtimeToken) protected readonly runtime: Runtime,
    @Inject(databaseToken) private readonly db: Database,
    @Inject(eventBusToken) protected readonly eventBus: EventBus,
  ) {}

  protected repo = new Proxy({} as Repositories, {
    get: (_, p) => {
      return this.db.getRepository(p as keyof Repositories);
    },
  });

  get transaction() {
    return this.db.transaction.bind(this.db);
  }
}
