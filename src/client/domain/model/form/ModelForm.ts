import { ref, toRaw, type Ref } from '@vue/reactivity';
import { watch, type WatchStopHandle } from '@vue-reactivity/watch';
import isObject from 'lodash/isObject';
import get from 'lodash/get';
import set from 'lodash/set';
import unset from 'lodash/unset';

import { InvalidInputError, type Issues } from 'model/Error';

export default abstract class ModelForm<T> {
  errors = ref<Issues<T>>({});
  #errorFieldValidateStoppers = new Set<WatchStopHandle>();
  #submitHandler?: (values: T) => Promise<void>;

  abstract readonly values: Ref<T>;

  readonly handleSubmit = (handler: (values: T) => Promise<void>) => {
    this.#submitHandler = handler;
  };

  readonly submit = async () => {
    if (!this.#submitHandler) {
      throw new Error('no submit handler');
    }

    if (Object.keys(this.errors.value).length > 0 || !this.values.value) {
      return;
    }

    // local validation passed. Waiting for remote validation
    try {
      await this.#submitHandler(toRaw(this.values.value));
      this.destroy();
      return true;
    } catch (e) {
      if (!InvalidInputError.is(e)) {
        throw e;
      }

      this.errors.value = e.issues;
      this.#watchErrorFields(this.errors.value);
      return false;
    }
  };

  #watchErrorFields(obj: unknown, path: string[] = []) {
    if (isObject(obj)) {
      for (const key of Object.keys(obj)) {
        this.#watchErrorFields(obj[key as keyof typeof obj], [...path, key]);
      }
    } else {
      const wrongValue = get(this.values.value, path);
      const errorMessage = obj;
      const watcher = watch(
        () => get(this.values.value, path),
        (value) => {
          if (wrongValue === value) {
            set(this.errors.value, path, errorMessage);
          } else {
            unset(this.errors.value, path);
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
