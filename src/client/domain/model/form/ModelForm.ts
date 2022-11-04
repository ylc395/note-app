import { ref, toRaw, type Ref } from '@vue/reactivity';
import { watch, type WatchStopHandle } from '@vue-reactivity/watch';
import type { Struct } from 'superstruct';
import debounce from 'lodash/debounce';
import get from 'lodash/get';

import { InvalidInputError, getErrors, type InvalidInputErrorCause } from 'model/Error';

interface Errors {
  [k: string]: Errors | string;
}

export default abstract class ModelForm<T> {
  errors = ref<Errors>({});
  #stopWatch = new Set<WatchStopHandle>();

  protected abstract readonly schema: Struct<T>;
  values: Ref<T>;

  constructor(private initialValues: () => T, protected readonly onSubmit: (value: T) => Promise<void>) {
    this.values = ref(this.initialValues()) as Ref<T>;
  }

  #validate = () => {
    const [error] = this.schema.validate(this.values.value);
    this.errors.value = error ? getErrors(error) : {};

    return !error;
  };

  readonly submit = async () => {
    if (Object.keys(this.errors.value).length > 0) {
      return;
    }

    const isValid = this.#validate();

    if (!isValid) {
      this.#stopWatch.add(watch(this.values, debounce(this.#validate, 500), { deep: true }));
      return false;
    }

    // local validation passed. Waiting for remote validation
    this.#emptyStopWatch();

    try {
      await this.onSubmit(toRaw(this.values.value));
      this.reset();
      return true;
    } catch (e) {
      if (e instanceof InvalidInputError && e.cause) {
        this.errors.value = e.cause as InvalidInputErrorCause;

        for (const path of Object.keys(this.errors.value)) {
          const stop = watch(
            () => get(this.values.value, path),
            () => {
              delete this.errors.value[path];
              stop();
              this.#stopWatch.delete(stop);
            },
          );

          this.#stopWatch.add(stop);
        }

        return false;
      }

      throw e;
    }
  };

  readonly reset = () => {
    this.errors.value = {};
    this.values.value = this.initialValues();

    this.#emptyStopWatch();
  };

  protected destroy() {
    this.#emptyStopWatch();
  }

  #emptyStopWatch() {
    Array.from(this.#stopWatch).forEach((stop) => stop());
    this.#stopWatch.clear();
  }
}
