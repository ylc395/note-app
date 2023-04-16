import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { token as databaseToken, type Database } from 'infra/Database';
import { token as downloaderToken, type Downloader } from 'infra/Downloader';
import type Repositories from './repository';

interface CachePropertyDescriptor<T, R> extends PropertyDescriptor {
  get?: (this: T) => R;
}

function cache<T, R>(target: BaseService, name: PropertyKey, descriptor: CachePropertyDescriptor<T, R>) {
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
  constructor(
    @Inject(databaseToken) readonly db: Database,
    @Inject(downloaderToken) protected readonly downloader: Downloader,
    protected readonly eventEmitter: EventEmitter2,
  ) {}

  @cache
  get notes() {
    return this.db.getRepository('notes');
  }

  @cache
  get recyclables() {
    return this.db.getRepository('recyclables');
  }

  @cache
  get stars() {
    return this.db.getRepository('stars');
  }

  @cache
  get resources() {
    return this.db.getRepository('resources');
  }

  @cache
  get memos() {
    return this.db.getRepository('memos');
  }

  @cache
  get materials() {
    return this.db.getRepository('materials');
  }

  @cache
  get revisions() {
    return this.db.getRepository('revisions');
  }
}
