/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import singletonContainer from '#utils/singletonContainer';
import type { ZodType } from 'zod';
import { token } from '../../infra/documentDb';
import { observable, runInAction, toJS } from 'mobx';
import { debounce } from 'lodash-es';

// 用于存储可序列化字段名的 Symbol 键
const SERIALIZABLE_KEY = Symbol('serializable-fields');

// 扩展构造函数类型
interface SerializableConstructor extends Function {
  [SERIALIZABLE_KEY]?: Set<string | symbol>;
}

// 基于文档型数据库的 ODM （Object-Document Mapping）
export default abstract class Odm {
  constructor(private readonly storeName: string, private readonly id: unknown) {
    this.load();
  }

  private readonly db = singletonContainer.resolve(token);

  @observable public accessor isReady = false;

  private get exposedKeys() {
    const constructor = this.constructor as SerializableConstructor;
    const serializableProps = constructor[SERIALIZABLE_KEY];

    if (!serializableProps) return [];

    return Array.from(serializableProps).filter(
      (key) => typeof key === 'string' && typeof (this as any)[key] !== 'function',
    ) as string[];
  }

  private toJSON(): Record<string, any> {
    const data: Record<string, any> = {};
    const serializableProps = this.exposedKeys;

    for (const key of serializableProps) {
      data[key] = toJS((this as any)[key]);
    }

    return { id: this.id, ...data };
  }

  private async load() {
    const value = await this.db.getByKey(this.storeName, this.id);

    if (!value || typeof value !== 'object') {
      runInAction(() => {
        this.isReady = true;
      });
      return;
    }

    const exposedKeys = this.exposedKeys;

    runInAction(() => {
      for (const [k, v] of Object.entries(value)) {
        if (exposedKeys.includes(k)) {
          this[k as keyof this] = v;
        }
      }

      this.isReady = true;
    });
  }

  public save() {
    return this.db.put(this.storeName, this.toJSON());
  }

  public readonly debouncedSave = debounce(this.save.bind(this), 500);

  public static autoSave<T extends Odm>() {
    const wrap = (target: Function) =>
      function (this: T, ...args: any[]) {
        const result = target.apply(this, args);
        this.debouncedSave();

        return result;
      };

    return function (target: Function, context: ClassMethodDecoratorContext<T> | ClassFieldDecoratorContext<T>) {
      const { kind } = context;

      if (kind === 'method') {
        return wrap(target);
      }

      if (kind === 'field') {
        return function (initialValue: unknown) {
          if (typeof initialValue !== 'function') {
            throw new Error('must be a function');
          }

          return wrap(initialValue);
        };
      }

      throw new Error(`@autoSave 不支持装饰: ${kind}`);
    };
  }

  public static expose(schema?: ZodType) {
    return function <This, Value>(
      value: ClassAccessorDecoratorTarget<This, Value>,
      context: ClassAccessorDecoratorContext<This, Value>,
    ): ClassAccessorDecoratorResult<This, Value> | void {
      if (context.kind !== 'accessor' || context.static) {
        throw new Error('@serializable 只能用于 accessor 字段（使用 `accessor` 关键字）');
      }

      context.addInitializer(function (this: any) {
        const constructor = this.constructor as SerializableConstructor;

        if (!constructor[SERIALIZABLE_KEY]) {
          Object.defineProperty(constructor, SERIALIZABLE_KEY, {
            value: new Set<string | symbol>(),
            writable: false,
            configurable: false,
            enumerable: false,
          });
        }

        constructor[SERIALIZABLE_KEY]!.add(context.name);
      });

      const { get, set } = value;

      return {
        get,
        set(newValue: Value): void {
          if (!schema || schema.safeParse(newValue).success) {
            return set.call(this, newValue);
          }
        },
        init(initialValue: Value): Value {
          schema?.parse(initialValue);
          return initialValue;
        },
      };
    };
  }

  public destroy() {
    this.debouncedSave.flush();
  }
}
