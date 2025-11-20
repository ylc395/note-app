import { observable, runInAction, toJS } from 'mobx';
import { debounce, pick } from 'lodash-es';
import type { ZodType } from 'zod';

const SERIALIZABLE_KEY = Symbol('serializable-fields');

// 扩展构造函数类型
interface ActiveRecordConstructor {
  [SERIALIZABLE_KEY]?: Set<string>;
}

// 此类对象与某种持久化数据库建立读/写关系
export default abstract class ActiveRecord {
  constructor() {
    Promise.resolve().then(() => this.load());
  }

  @observable public accessor isReady = false;

  protected abstract getValue(): Promise<unknown>;

  private get exposedKeys() {
    const constructor = this.constructor as ActiveRecordConstructor;
    const serializableProps = constructor[SERIALIZABLE_KEY];

    if (!serializableProps) return [];

    return Array.from(serializableProps).filter((key) => typeof key === 'string') as string[];
  }

  protected toJSON() {
    const data: Record<string, unknown> = {};
    const serializableProps = this.exposedKeys;

    for (const key of serializableProps) {
      data[key] = toJS(this[key as keyof this]);
    }

    return data;
  }

  private async load() {
    const value = await this.getValue();

    if (!value || typeof value !== 'object') {
      runInAction(() => {
        this.isReady = true;
      });
      return;
    }

    runInAction(() => {
      // 不满足 schema 的 key 值会静默失败
      Object.assign(this, pick(value, this.exposedKeys));
      this.isReady = true;
    });
  }

  protected abstract save(): Promise<void>;

  private readonly debouncedSave = debounce(this.save.bind(this), 500);

  public destroy() {
    this.debouncedSave.flush();
  }

  // 被标注为 bidi 的字段会自动读取数据库中的字段，并在被修改（仅限赋值）时写入数据库
  public static bidi<Value>(schema: ZodType<Value>) {
    return function <This extends ActiveRecord>(
      value: ClassAccessorDecoratorTarget<This, Value>,
      context: ClassAccessorDecoratorContext<This, Value>,
    ): ClassAccessorDecoratorResult<This, Value> | void {
      const { name } = context;

      if (context.kind !== 'accessor' || context.static || typeof name !== 'string') {
        throw new Error('@bidi 只能用于 accessor 字段（使用 `accessor` 关键字）');
      }

      context.addInitializer(function () {
        const constructor = (this as object).constructor as ActiveRecordConstructor;

        if (!constructor[SERIALIZABLE_KEY]) {
          Object.defineProperty(constructor, SERIALIZABLE_KEY, {
            value: new Set<string | symbol>(),
            writable: false,
            configurable: false,
            enumerable: false,
          });
        }

        constructor[SERIALIZABLE_KEY]!.add(name);
      });

      const { get, set } = value;

      return {
        get,
        set(newValue: unknown) {
          const parsed = schema.safeParse(newValue);

          if (parsed.success) {
            const result = set.call(this, parsed.data);
            this.debouncedSave();

            return result;
          }
        },
        init(initialValue: unknown): Value {
          return schema.parse(initialValue);
        },
      };
    };
  }
}
