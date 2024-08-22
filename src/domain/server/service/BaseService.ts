import { container } from 'tsyringe';
import assert from 'node:assert';

import { token as databaseToken } from '@domain/server/infra/database.js';
import eventBus from '@domain/server/infra/eventBus.js';
import { token as repositoriesToken } from '../repository/index.js';

export default abstract class BaseService {
  private readonly db = container.resolve(databaseToken);
  protected readonly eventBus = eventBus;
  protected repo = container.resolve(repositoriesToken);

  protected get transaction() {
    return this.db.transaction.bind(this.db);
  }

  public static transaction() {
    return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;
      assert(typeof originalMethod === 'function');

      descriptor.value = function (...args: unknown[]) {
        assert(this instanceof BaseService);

        return this.transaction(() => {
          return originalMethod.apply(this, args);
        });
      };
    };
  }
}
