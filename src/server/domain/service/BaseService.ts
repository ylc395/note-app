import { container } from 'tsyringe';

import { token as databaseToken } from '@domain/infra/database.js';
import eventBus from '@domain/infra/eventBus.js';
import { token as runtimeToken } from '@domain/infra/runtime.js';
import type Repositories from './repository/index.js';

export default abstract class BaseService {
  protected readonly runtime = container.resolve(runtimeToken);
  private readonly db = container.resolve(databaseToken);
  protected readonly eventBus = eventBus;

  protected repo = new Proxy({} as Repositories, {
    get: (_, p) => {
      return this.db.getRepository(p as keyof Repositories);
    },
  });

  get transaction() {
    return this.db.transaction.bind(this.db);
  }
}
