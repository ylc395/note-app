import { assert } from 'console';
import { action, computed, makeObservable, observable, toJS } from 'mobx';
import type { ZodSchema } from 'zod';

interface FieldOption<T> {
  initialValue: T;
  transform?: (v: T) => T;
  validate?: ((value: T) => string | false | null) | { schema: ZodSchema<T>; message: string };
}

interface FormError {
  message: string;
  fatal: boolean;
}

type Fields<T> = {
  [K in keyof T]: FieldOption<T[K]>;
};

export default class Form<T> {
  constructor(private readonly options: Fields<T>) {
    this.init();
    makeObservable(this);
  }

  private init() {
    for (const [key, option] of Object.entries(this.options)) {
      this.set(key as keyof T, (option as FieldOption<never>).initialValue);
    }
  }

  @observable private readonly _values = {} as T;
  @observable public errors = {} as Record<keyof T, FormError | undefined>;

  @action
  public setError(field: keyof T, error: FormError) {
    this.errors[field] = error;
  }

  @computed
  public get isValid() {
    return (Object.values(this.errors) as FormError[]).filter((err) => err.fatal).length === 0;
  }

  public readonly getValues = () => {
    if (this.isValid) {
      return toJS(this._values);
    }
  };

  @action
  public set<K extends keyof T>(key: K, value: T[K]) {
    const fieldOption = this.options[key];
    let error = '';
    value = fieldOption.transform ? fieldOption.transform(value) : value;

    if (fieldOption.validate) {
      if (typeof fieldOption.validate === 'function') {
        error = fieldOption.validate(value) || '';
      } else {
        const result = fieldOption.validate.schema.safeParse(value);

        if (!result.success) {
          error = fieldOption.validate.message;
        }
      }
    }

    if (error) {
      this.errors[key] = { message: error, fatal: true };
    } else {
      delete this.errors[key];
    }

    this._values[key] = value;
  }

  public get<K extends keyof T>(key: K) {
    const value = this._values[key];
    assert(value !== undefined);

    return value;
  }
}
