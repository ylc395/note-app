import { container } from 'tsyringe';
import assert from 'node:assert';

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

  public get transaction() {
    return this.db.transaction.bind(this.db);
  }
}

export function transaction(target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  assert(typeof originalMethod === 'function');

  descriptor.value = function (...args: unknown[]) {
    assert(this instanceof BaseService);

    return this.transaction(() => {
      return originalMethod.apply(this, args);
    });
  };
}
