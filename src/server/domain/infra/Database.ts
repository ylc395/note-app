import isError from 'lodash/isError';
import { container } from 'tsyringe';

import type Repositories from 'service/repository';

export interface Transaction {
  commit: () => Promise<unknown>;
  rollback: (e: Error) => Promise<unknown>;
}

export interface Database {
  createTransaction: () => Promise<Transaction>;
  getRepositoryWithTransaction: <T extends keyof Repositories>(trx: Transaction, name: T) => Repositories[T];
  getRepository: <T extends keyof Repositories>(name: T) => Repositories[T];
  init: (dir: string) => Promise<void>;
}

export const token = Symbol('database');

const REPOSITORY_NAMES: (keyof Repositories)[] = ['notes', 'recyclables'];

const isRepositoryName = function (key: string | symbol): key is keyof Repositories {
  return (REPOSITORY_NAMES as (string | symbol)[]).includes(key);
};

export function Transaction(target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
  const originFunction = descriptor.value;

  descriptor.value = async function (...args: unknown[]) {
    const db: Database = container.resolve(token);
    const trx = await db.createTransaction();
    const _repositories = new Map<keyof Repositories, Repositories[keyof Repositories]>();
    const proxy = new Proxy(this, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      get(target: any, p, receiver) {
        if (typeof target[p] === 'function') {
          return target[p].bind(receiver);
        }

        if (isRepositoryName(p)) {
          if (!_repositories.has(p)) {
            _repositories.set(p, db.getRepositoryWithTransaction(trx, p));
          }

          return _repositories.get(p);
        }

        return target[p];
      },
    });

    let result;

    try {
      result = await originFunction.apply(proxy, args);
    } catch (error) {
      await trx.rollback(isError(error) ? error : new Error(String(error)));
      throw error;
    }

    await trx.commit();

    return result;
  };
}
