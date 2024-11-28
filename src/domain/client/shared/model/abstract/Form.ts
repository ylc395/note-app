import { identity } from 'lodash-es';
import { action, computed, observable, toJS } from 'mobx';
import type { ZodError, ZodSchema } from 'zod';

interface FormError {
  message: string;
  fatal: boolean;
}

interface FieldOption<T> {
  initialValue?: T;
  isRequired?: boolean;
  transform?: (v: T) => T;
  validate?:
    | ((value: T) => FormError | undefined | Promise<FormError | undefined>)
    | { schema: ZodSchema<T>; error?: (error: ZodError) => FormError };
}

type FieldOptions<T> = {
  [K in keyof T]: FieldOption<T[K]>;
};

export default class Form<T> {
  constructor(private readonly options: FieldOptions<T>) {
    for (const [key, option] of Object.entries(this.options)) {
      this.set(key as keyof T, (option as FieldOption<T[keyof T]>).initialValue);
    }
  }

  @observable.shallow private accessor values: Partial<Record<keyof T, T[keyof T]>> = {};

  @observable.shallow private accessor validatedErrors: Partial<Record<keyof T, FormError>> = {};

  @computed
  private get emptyErrors() {
    const emptyErrors: Partial<Record<keyof T, FormError>> = {};

    for (const [key, option] of Object.entries(this.options)) {
      const value = this.values[key as keyof T];

      if (value === undefined && (option as FieldOption<T[keyof T]>).isRequired) {
        emptyErrors[key as keyof T] = { fatal: true, message: '不能为空' };
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
    if (Object.values(this.validatingCountMap).filter(identity).length > 0) {
      return false;
    }

    return Object.values(this.errors).filter((err) => err && (err as FormError).fatal).length === 0;
  }

  public getValues() {
    return toJS(this.values as Partial<T>);
  }

  @observable private accessor validatingCountMap: Partial<Record<keyof T, number>> = {};

  @action
  public set<K extends keyof T>(key: K, value: T[K] | undefined) {
    if (typeof value === 'undefined') {
      delete this.values[key];
      return;
    }

    const fieldOption = this.options[key];
    value = fieldOption.transform?.(value) ?? value;
    this.values[key] = value;

    if (!fieldOption.validate) {
      return;
    }

    this.validatingCountMap[key] = (this.validatingCountMap[key] ?? 0) + 1;

    if (typeof fieldOption.validate !== 'function') {
      const result = fieldOption.validate.schema.safeParseAsync(value);
      const getError = fieldOption.validate.error;

      result.then(
        action((result) => {
          if (!result.success && this.values[key] === value) {
            this.validatedErrors[key] = getError?.(result.error) || { message: 'error', fatal: false };
          }
          this.validatingCountMap[key]! -= 1;
        }),
      );
    } else {
      Promise.resolve(fieldOption.validate(value)).then(
        action((err) => {
          if (this.values[key] === value) {
            this.validatedErrors[key] = err;
          }
          this.validatingCountMap[key]! -= 1;
        }),
      );
    }
  }

  public get(key: keyof T) {
    return this.values[key];
  }

  public isValidating(key: keyof T) {
    return !this.validatingCountMap[key];
  }
}
