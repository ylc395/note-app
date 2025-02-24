import assert from 'assert';
import { action, computed, observable, toJS } from 'mobx';

interface FormError {
  type?: string | symbol;
  message: string;
  fatal: boolean;
}

export interface FieldOption<T> {
  initialValue?: T;
  isRequired?: boolean;
  validate?: (value: T) => FormError | undefined | Promise<FormError | undefined>;
}

type FieldOptions<T> = {
  [K in keyof T]: FieldOption<T[K]>;
};

export default class Form<T> {
  constructor(private readonly options?: FieldOptions<T>) {
    for (const [key, option] of Object.entries(this.options || {})) {
      this.set(key as keyof T, (option as FieldOptions<T>[keyof T]).initialValue);
    }
  }

  @observable.shallow private accessor value: Partial<T> = {};

  @observable.shallow private accessor validatedErrors: Partial<Record<keyof T, FormError>> = {};

  @computed
  private get emptyErrors() {
    const emptyErrors: Partial<Record<keyof T, FormError>> = {};

    for (const [key, option] of Object.entries(this.options || {})) {
      const value = this.value[key as keyof T];

      if (value === undefined && (option as FieldOption<unknown>).isRequired) {
        emptyErrors[key as keyof T] = {
          fatal: true,
          message: '不能为空',
          type: Form.REQUIRED_ERROR_TYPE,
        };
      }
    }

    return emptyErrors;
  }

  @computed
  public get errors() {
    return {
      ...this.emptyErrors,
      ...this.validatedErrors,
    };
  }

  @computed
  public get isValid() {
    if (this.validatingFields.size > 0) {
      return false;
    }

    return Object.values(this.errors).filter((err) => err && (err as FormError).fatal).length === 0;
  }

  public get(): Partial<T>;
  public get(key: keyof T): Partial<T>[keyof T];
  public get(key?: keyof T) {
    return key ? this.value[key] : toJS(this.value);
  }

  @observable private accessor validatingFields = new Set<keyof T>();

  @action
  public set<K extends keyof T>(key: K, value: T[K] | undefined) {
    assert(!this.validatingFields.has(key), `${String(key)} is validating`);

    if (typeof value === 'undefined') {
      delete this.value[key];
      return;
    }

    const fieldOption = this.options?.[key];
    this.value[key] = value;

    if (!fieldOption?.validate) {
      return;
    }

    const validating = fieldOption.validate(value);
    const handleValidated = (err: FormError | undefined) => {
      this.validatedErrors[key] = err;
      this.validatingFields.delete(key);
    };

    if (validating instanceof Promise) {
      this.validatingFields.add(key);
      validating.then(action(handleValidated));
    } else {
      handleValidated(validating);
    }
  }

  public isValidating(key: keyof T) {
    return this.validatingFields.has(key);
  }

  public static REQUIRED_ERROR_TYPE = Symbol();
}
