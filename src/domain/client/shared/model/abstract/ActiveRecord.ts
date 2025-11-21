import { isObservable, observable, runInAction, toJS } from 'mobx';
import { deepObserve } from 'mobx-utils';
import { debounce } from 'lodash-es';
import type { ZodType } from 'zod';

const BIDI_KEY = Symbol('bidi');

// 扩展构造函数类型
interface ActiveRecordConstructor {
  [BIDI_KEY]?: Record<string, ZodType>;
}

// 此类对象与某种持久化数据库建立读/写关系
// 这种抽象把“业务（业务层面）”和“持久化（技术层面）”两套语义混在一起了，在前端用用差不多（处理一些无关紧要的数据），不要用在后端
export default abstract class ActiveRecord {
  constructor() {
    Promise.resolve().then(() => this.load());
  }

  @observable public accessor isReady = false;

  private readonly deepObserveDisposers = new Map<string, () => void>();

  protected abstract getValue(): Promise<unknown>;

  private get bidiKeys() {
    const constructor = this.constructor as ActiveRecordConstructor;
    const serializableProps = constructor[BIDI_KEY];

    if (!serializableProps) return [];

    return Object.keys(serializableProps).filter((key) => typeof key === 'string') as string[];
  }

  protected toJSON() {
    const data: Record<string, unknown> = {};
    const bidiKeys = this.bidiKeys;

    for (const key of bidiKeys) {
      data[key] = toJS(this[key as keyof this]);
    }

    return data;
  }

  private async load() {
    const value = await this.getValue();

    runInAction(() => {
      if (typeof value === 'object' && value) {
        for (const key of this.bidiKeys) {
          const schema = (this.constructor as ActiveRecordConstructor)[BIDI_KEY]![key]!;

          if (key in value) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const parsed = schema.safeParse((value as any)[key]);

            if (parsed.success) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (this as any)[key] = parsed.data;
            }
          }
        }
      }
      this.isReady = true;
    });
  }

  protected abstract save(): Promise<void>;

  private readonly debouncedSave = debounce(this.save.bind(this), 300);

  public destroy() {
    this.debouncedSave.flush();
    // 销毁时清理所有的 deepObserve 监听
    this.deepObserveDisposers.forEach((disposer) => disposer());
    this.deepObserveDisposers.clear();
  }

  private deepObserve(name: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reactiveValue = (this as any)[name];

    if (isObservable(reactiveValue)) {
      const disposer = deepObserve(reactiveValue, () => {
        this.isReady && this.debouncedSave();
      });
      this.deepObserveDisposers.set(name, disposer);
    }
  }

  // 被标注为 bidi 的字段会自动读取数据库中的字段（经过 schema parse），并在被修改时（含深层的修改）写入数据库
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

        if (!constructor[BIDI_KEY]) {
          Object.defineProperty(constructor, BIDI_KEY, {
            value: {},
            writable: false,
            configurable: false,
            enumerable: false,
          });
        }

        constructor[BIDI_KEY]![name] = schema;
      });

      const { get, set, init } = observable(value, context) as ClassAccessorDecoratorResult<This, Value>;

      return {
        get,
        set(newValue: unknown) {
          const parsedValue = schema.parse(newValue);
          set!.call(this, parsedValue);
          const propertyName = String(name);

          if (this.deepObserveDisposers.has(propertyName)) {
            this.deepObserveDisposers.get(propertyName)!();
            this.deepObserveDisposers.delete(propertyName);
          }

          this.deepObserve(propertyName);

          if (this.isReady) {
            this.debouncedSave();
          }
        },
        init(value) {
          const initialValue = init!.call(this, schema.parse(value));
          this.deepObserve(String(name));

          return initialValue;
        },
      };
    };
  }
}
