import { ref, toRaw } from '@vue/reactivity';
import { watch, watchEffect, type WatchStopHandle } from '@vue-reactivity/watch';
import type { ZodType } from 'zod';
import debounce from 'lodash/debounce';

import { InvalidInputError, type Issues, getIssuesFromZodError } from 'model/Error';

export default abstract class ModelForm<T> {
  errors = ref<Issues>({});
  #stopWatchInitialValues: WatchStopHandle;
  #stopWatchValidate?: WatchStopHandle;
  protected abstract readonly schema: ZodType<T>;
  readonly values = ref<T>();

  constructor(private initialValues: () => T) {
    this.#stopWatchInitialValues = watchEffect(() => {
      this.values.value = this.initialValues();
    });
  }

  #validate = () => {
    const result = this.schema.safeParse(this.values.value);
    this.errors.value = result.success ? {} : getIssuesFromZodError(result.error);

    return result.success;
  };

  readonly handleSubmit = (submit: (values: T) => Promise<void>) => {
    return async () => {
      if (Object.keys(this.errors.value).length > 0 || !this.values.value) {
        return;
      }

      const isValid = this.#validate();

      if (!isValid) {
        if (!this.#stopWatchValidate) {
          this.#stopWatchValidate = watch(this.values, debounce(this.#validate, 500), { deep: true });
        }
        return false;
      }

      // local validation passed. Waiting for remote validation

      try {
        await submit(toRaw(this.values.value));
        this.reset();
        return true;
      } catch (e) {
        if (!InvalidInputError.is(e)) {
          throw e;
        }

        this.errors.value = e.issues;
        return false;
      }
    };
  };

  readonly reset = () => {
    this.errors.value = {};
    this.values.value = this.initialValues();

    if (this.#stopWatchValidate) {
      this.#stopWatchValidate();
      this.#stopWatchValidate = undefined;
    }
  };

  readonly destroy = () => {
    this.#stopWatchInitialValues();
  };
}
