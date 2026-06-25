import container from '#utils/singletonContainer.js';
import { token as databaseToken } from './database.js';
import { token as loggerToken } from '#domain/shared/infra/logger.js';

/**
 * 方法级事务装饰器：将被装饰的异步方法整体包裹在数据库事务中执行。
 * 事务通过 AsyncLocalStorage 传播，方法内嵌套的 transactional / withTransaction 会复用当前事务而不重复开启。
 */
export function transactional<This, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Promise<Return>,
  _: ClassMethodDecoratorContext,
) {
  return async function (this: This, ...args: Args): Promise<Return> {
    const db = container.resolve(databaseToken);
    const logger = container.resolve(loggerToken);

    return db.transaction(async () => {
      try {
        return await target.apply(this, args);
      } catch (error) {
        logger.error('[transaction] failed:', error);
        throw error;
      }
    });
  };
}

/**
 * 命令式事务：用于无法用装饰器包裹的内联场景（如方法体内某段需要单独事务）。
 * 若已在事务上下文中（AsyncLocalStorage），则直接复用当前事务。
 */
export function withTransaction<T>(cb: () => Promise<T>): Promise<T> {
  return container.resolve(databaseToken).transaction(cb);
}
