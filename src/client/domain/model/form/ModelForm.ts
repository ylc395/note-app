import { observable, makeObservable, toJS, action, reaction, flowResult, type IReactionDisposer } from 'mobx';
import isObject from 'lodash/isObject';
import get from 'lodash/get';
import set from 'lodash/set';
import unset from 'lodash/unset';

import { InvalidInputError, type Issues } from 'model/Error';

export default abstract class ModelForm<T> {
  constructor() {
    makeObservable(this);
  }
  @observable.shallow errors: Issues<T> = {};
  #errorFieldValidateStoppers = new Set<IReactionDisposer>();
  #submitHandler?: (values: T) => Promise<void>;

  abstract values: T;

  readonly handleSubmit = (handler: (values: T) => Promise<void> | Generator) => {
    this.#submitHandler = (values: T) => flowResult(handler(values));
  };

  readonly submit = async () => {
    if (!this.#submitHandler) {
      throw new Error('no submit handler');
    }

    if (Object.keys(this.errors).length > 0 || !this.values) {
      return;
    }

    // local validation passed. Waiting for remote validation
    try {
      await this.#submitHandler(toJS(this.values));
      this.destroy();
      return true;
    } catch (e) {
      if (!InvalidInputError.is(e)) {
        throw e;
      }

      this.errors = e.issues;
      this.watchErrorFields(this.errors);
      return false;
    }
  };

  @action.bound
  private watchErrorFields(obj: unknown, path: string[] = []) {
    if (isObject(obj)) {
      for (const key of Object.keys(obj)) {
        this.watchErrorFields(obj[key as keyof typeof obj], [...path, key]);
      }
    } else {
      const wrongValue = get(this.values, path);
      const errorMessage = obj;
      const watcher = reaction(
        () => get(this.values, path),
        (value) => {
          if (wrongValue === value) {
            set(this.errors, path, errorMessage);
          } else {
            unset(this.errors, path);
          }
        },
      );
      this.#errorFieldValidateStoppers.add(watcher);
    }
  }

  readonly destroy = () => {
    Array.from(this.#errorFieldValidateStoppers).forEach((stop) => stop());
    this.#errorFieldValidateStoppers.clear();
  };
}
