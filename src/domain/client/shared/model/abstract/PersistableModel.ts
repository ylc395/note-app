/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ZodType } from 'zod';
import { observable, runInAction, toJS } from 'mobx';
import { debounce } from 'lodash-es';

// 用于存储可序列化字段名的 Symbol 键
const SERIALIZABLE_KEY = Symbol('serializable-fields');

// 扩展构造函数类型
interface SerializableConstructor extends Function {
  [SERIALIZABLE_KEY]?: Set<string | symbol>;
}

// 此类对象与某种持久化数据库建立读/写关系
export default abstract class PersistableModel {
  constructor() {
    Promise.resolve().then(() => this.load());
  }

  @observable public accessor isReady = false;

  private get exposedKeys() {
    const constructor = this.constructor as SerializableConstructor;
    const serializableProps = constructor[SERIALIZABLE_KEY];

    if (!serializableProps) return [];

    return Array.from(serializableProps).filter(
      (key) => typeof key === 'string' && typeof (this as any)[key] !== 'function',
    ) as string[];
  }

  protected toJSON(): Record<string, any> {
    const data: Record<string, any> = {};
    const serializableProps = this.exposedKeys;

    for (const key of serializableProps) {
      data[key] = toJS((this as any)[key]);
    }

    return data;
  }

  protected abstract getValue(): Promise<unknown>;

  private async load() {
    const value = await this.getValue();

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

  public abstract save(): Promise<void>;

  public readonly debouncedSave = debounce(this.save.bind(this), 500);

  public static expose<Value>(schema: ZodType<Value>) {
    return function <This>(
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
        set(newValue: unknown): void {
          const parsed = schema.safeParse(newValue);

          if (parsed.success) {
            return set.call(this, parsed.data);
          }
        },
        init(initialValue: unknown): Value {
          return schema.parse(initialValue);
        },
      };
    };
  }

  public destroy() {
    this.debouncedSave.flush();
  }
}
