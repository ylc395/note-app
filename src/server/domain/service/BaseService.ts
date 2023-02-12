import { Inject, Injectable } from '@nestjs/common';

import { token as databaseToken, Database } from 'infra/Database';
import type Repositories from './repository';

interface CachePropertyDescriptor<T, R> extends PropertyDescriptor {
  get?: (this: T) => R;
}

export function cache<T, R>(target: BaseService, name: PropertyKey, descriptor: CachePropertyDescriptor<T, R>) {
  const getter = descriptor.get;

  if (!getter) throw new TypeError('Getter property descriptor expected');

  descriptor.get = function (this: T) {
    const value = getter.call(this);

    Object.defineProperty(this, name, {
      configurable: descriptor.configurable,
      enumerable: descriptor.enumerable,
      writable: false,
      value,
    });

    return value;
  };
}

@Injectable()
export default class BaseService implements Repositories {
  constructor(@Inject(databaseToken) readonly db: Database) {}

  @cache
  get notes() {
    return this.db.getRepository('notes');
  }

  @cache
  get recyclables() {
    return this.db.getRepository('recyclables');
  }
}
