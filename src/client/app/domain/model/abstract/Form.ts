import { set, cloneDeep } from 'lodash-es';
import { observable, makeObservable, computed, action, runInAction, toJS } from 'mobx';

type ValuePath = string;
type ErrorMessage = string;
type ErrorInfo = { path: ValuePath; message: ErrorMessage };
type Errors = Record<ValuePath, ErrorMessage>;
type RuleResult = ErrorInfo[] | ErrorInfo | ErrorMessage | undefined;

type Rules<T extends object> = {
  [K in keyof T]?:
    | {
        predict: (value: unknown, form: Base<T>) => boolean | Promise<boolean>;
        message: ErrorMessage;
      }
    | ((value: unknown, form: Base<T>) => Promise<RuleResult> | RuleResult);
};

export default abstract class Base<T extends object> {
  protected readonly rules?: Rules<T>;
  @observable readonly values: T;
  @observable readonly errors: Errors = {};
  constructor(initValues: T) {
    this.values = cloneDeep(initValues);
    makeObservable(this);
  }

  @computed get isValid() {
    return Object.keys(this.errors).length === 0;
  }

  async validate() {
    for (const key of Object.keys(this.values)) {
      await this.validateField(key as keyof T);
    }

    if (this.isValid) {
      return toJS(this.values);
    }
  }

  private async validateField(key: keyof T) {
    if (!this.rules) {
      return;
    }

    const value = this.values[key];
    const rule = this.rules[key];

    if (!rule) {
      return;
    }

    runInAction(() => {
      const keys = Object.keys(this.errors).filter((k) => k === key || k.startsWith(`${key as string}.`));

      for (const k of keys) {
        delete this.errors[k];
      }
    });

    if (typeof rule === 'function') {
      const result = await rule(value, this);

      if (!result) {
        return;
      }

      runInAction(() => {
        if (typeof result === 'string') {
          this.errors[key as string] = result;
        } else {
          const results = Array.isArray(result) ? result : [result];

          for (const { message, path } of results) {
            this.errors[`${key as string}.${path}`] = message;
          }
        }
      });
    } else {
      const result = await rule.predict(value, this);

      if (result) {
        return;
      }

      runInAction(() => {
        this.errors[key as string] = rule.message;
      });
    }
  }

  updateValue<K extends keyof T>(key: K, value: Base<T>['values'][K]): void;
  updateValue(key: string, value: unknown): void;
  @action updateValue(key: string, value: unknown) {
    set(this.values, key, value);
    this.validateField(key as keyof T);
  }
}
