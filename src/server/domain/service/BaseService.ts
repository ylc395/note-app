import { Inject, Injectable } from '@nestjs/common';

import { token as databaseToken, type Database } from 'infra/database';

@Injectable()
export default class BaseService {
  constructor(@Inject(databaseToken) readonly db: Database) {}

  protected get materials() {
    return this.db.getRepository('materials');
  }

  protected get memos() {
    return this.db.getRepository('memos');
  }

  protected get notes() {
    return this.db.getRepository('notes');
  }

  protected get recyclables() {
    return this.db.getRepository('recyclables');
  }

  protected get files() {
    return this.db.getRepository('files');
  }

  protected get revisions() {
    return this.db.getRepository('revisions');
  }

  protected get stars() {
    return this.db.getRepository('stars');
  }

  protected get synchronization() {
    return this.db.getRepository('synchronization');
  }
}

export const Transaction: MethodDecorator = function (target, properKey, descriptor) {
  const originFunc = descriptor.value;

  if (typeof originFunc !== 'function') {
    throw new Error('not a function');
  }

  descriptor.value = function (this: unknown, ...args: unknown[]) {
    if (!(this instanceof BaseService)) {
      throw new Error('not a service');
    }

    return this.db.transaction(originFunc.bind(this, ...args));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
};
