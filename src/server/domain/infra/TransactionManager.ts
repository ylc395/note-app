import isError from 'lodash/isError';
import { container, type InjectionToken } from 'tsyringe';

export default interface TransactionManager {
  startTransaction: () => Promise<void>;
  endTransaction: (e?: Error) => Promise<void>;
}

export const token: InjectionToken<TransactionManager> = Symbol('TransactionManager');

export function Transaction(target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
  const originFunction = descriptor.value;
  descriptor.value = async function (...args: unknown[]) {
    const manager: TransactionManager = container.resolve(token);
    let result;

    await manager.startTransaction();

    try {
      result = await originFunction.apply(this, args);
    } catch (error) {
      await manager.endTransaction(isError(error) ? error : new Error(String(error)));
      throw error;
    }

    await manager.endTransaction();
    return result;
  };
}
