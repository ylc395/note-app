// 复刻 https://github.com/typestack/class-transformer 和 https://github.com/typestack/class-validator 。因为这些库不支持 ecma 标准的装饰器
import { pick } from 'lodash-es';

// 用于存储可序列化字段名的 Symbol 键
const SERIALIZABLE_KEY = Symbol('serializable-fields');
const DEFAULT_TAG_KEY = Symbol('default-tag');

// 扩展构造函数类型
interface SerializableConstructor {
  [SERIALIZABLE_KEY]?: Record<string | symbol, Set<string>>;
}

export function expose(tag?: string | symbol) {
  return function (
    value: ClassAccessorDecoratorTarget<unknown, unknown>,
    context: ClassAccessorDecoratorContext<unknown, unknown> | ClassFieldDecoratorContext<unknown, unknown>,
  ) {
    const { name } = context;
    if ((context.kind !== 'accessor' && context.kind !== 'field') || typeof name !== 'string' || context.static) {
      throw new Error('invalid decorator');
    }

    context.addInitializer(function () {
      const constructor = (this as object).constructor as SerializableConstructor;

      if (!constructor[SERIALIZABLE_KEY]) {
        Object.defineProperty(constructor, SERIALIZABLE_KEY, {
          value: new Map<typeof tag, string>(),
          writable: false,
          configurable: false,
          enumerable: false,
        });
      }

      const _tag = tag ?? DEFAULT_TAG_KEY;

      constructor[SERIALIZABLE_KEY]![_tag] ??= new Set();
      constructor[SERIALIZABLE_KEY]![_tag].add(name);
    });
  };
}

export function instanceToPlain(obj: object, tag?: string | symbol) {
  const exposedKeys = (obj.constructor as SerializableConstructor)[SERIALIZABLE_KEY]?.[tag ?? DEFAULT_TAG_KEY];

  if (!exposedKeys) {
    return {};
  }

  return pick(obj, Array.from(exposedKeys));
}
