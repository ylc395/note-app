import isError from 'lodash/isError';

import BaseService from 'service/BaseService';
import type Repositories from 'service/repository';
import { isRepositoryName } from 'service/repository';

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

const transactionOriginSymbol = Symbol('transactionOrigin');

const repositoriesCache = new WeakMap<Transaction, Map<keyof Repositories, Repositories[keyof Repositories]>>();

const getProxy = function (context: BaseService, trx: Transaction) {
  const _repositories = repositoriesCache.get(trx) || new Map();

  if (!repositoriesCache.has(trx)) {
    repositoriesCache.set(trx, _repositories);
  }

  return new Proxy(context, {
    get(target, p, receiver): unknown {
      if (isRepositoryName(p)) {
        if (!_repositories.has(p)) {
          _repositories.set(p, context.db.getRepositoryWithTransaction(trx, p));
        }

        return _repositories.get(p);
      }

      const originResult = Reflect.get(target, p);

      if (originResult instanceof BaseService) {
        return getProxy(originResult, trx);
      }

      if (typeof originResult === 'function') {
        if (originResult[transactionOriginSymbol]) {
          return originResult[transactionOriginSymbol];
        }

        return originResult.bind(receiver);
      }

      return originResult;
    },
  });
};

export function Transaction(target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
  const originFunction = descriptor.value;

  descriptor.value = async function (...args: unknown[]) {
    if (!(this instanceof BaseService)) {
      throw new Error('must be used in Service');
    }

    const trx = await this.db.createTransaction();
    const proxy = getProxy(this, trx);

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

  descriptor.value[transactionOriginSymbol] = originFunction;
}
