import { container } from 'tsyringe';
import assert from 'node:assert';
import { randomUUID } from 'node:crypto';

import { token as databaseToken } from '#domain/server/infra/database.js';
import { token as repositoriesToken } from '../repository/index.js';
import { token as runtimeToken } from '../infra/runtime.js';
import { token as kvToken } from '../infra/kvDatabase.js';

export default abstract class BaseService {
  private readonly db = container.resolve(databaseToken);
  protected readonly kv = container.resolve(kvToken);
  protected readonly repo = container.resolve(repositoriesToken);
  protected readonly runtime = container.resolve(runtimeToken);

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

  // generate id on business logic level instead of database level
  // see https://medium.com/ingeniouslysimple/why-did-we-shift-away-from-database-generated-ids-7e0e54a49bb3
  public static generateId() {
    // remove the "-" is ok
    // see https://stackoverflow.com/questions/51830845/how-safe-is-it-to-remove-the-in-a-randomly-generated-uuid
    return randomUUID().replaceAll('-', '');
  }
}
