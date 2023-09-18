import { Inject } from '@nestjs/common';

import { token as databaseToken, type Database } from 'infra/database';
import type Repositories from './repository';

export default abstract class BaseService {
  constructor(@Inject(databaseToken) private readonly db: Database) {}

  protected repo = new Proxy({} as Repositories, {
    get: (_, p) => {
      return this.db.getRepository(p as keyof Repositories);
    },
  });

  get transaction() {
    return this.db.transaction.bind(this.db);
  }
}
