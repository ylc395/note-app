import { ref, toRaw } from '@vue/reactivity';
import { watch, watchEffect, type WatchStopHandle } from '@vue-reactivity/watch';
import type { ZodType } from 'zod';
import debounce from 'lodash/debounce';
import isObject from 'lodash/isObject';
import get from 'lodash/get';
import set from 'lodash/set';
import unset from 'lodash/unset';

import { InvalidInputError, type Issues, getIssuesFromZodError } from 'model/Error';

export default abstract class ModelForm<T> {
  errors = ref<Issues>({});
  #stopWatchInitialValues: WatchStopHandle;
  #stopWatchValidate?: WatchStopHandle;
  #errorFieldValidateStoppers = new Set<WatchStopHandle>();

  protected abstract readonly schema: ZodType<T>;
  readonly values = ref<T>();

  constructor(private readonly initialValues: () => T) {
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
        // when local validation is not passed, start to watch & validate
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
        this.#watchErrorFields(this.errors.value);
        return false;
      }
    };
  };

  #watchErrorFields(obj: unknown, path: string[] = []) {
    if (isObject(obj)) {
      for (const key of Object.keys(obj)) {
        this.#watchErrorFields(obj[key as keyof typeof obj], [...path, key]);
      }
    } else {
      const wrongValue = get(this.values.value, path);
      const errorMessage = obj;
      this.#errorFieldValidateStoppers.add(
        watch(
          () => get(this.values.value, path),
          (value) => {
            if (wrongValue === value) {
              set(this.errors.value, path, errorMessage);
            } else {
              unset(this.errors.value, path);
            }
          },
        ),
      );
    }
  }

  readonly reset = () => {
    this.errors.value = {};
    this.values.value = this.initialValues();

    if (this.#stopWatchValidate) {
      this.#stopWatchValidate();
      this.#stopWatchValidate = undefined;
    }

    Array.from(this.#errorFieldValidateStoppers).forEach((stop) => stop());
    this.#errorFieldValidateStoppers.clear();
  };

  readonly destroy = () => {
    this.#stopWatchInitialValues();
    this.#stopWatchValidate?.();
    Array.from(this.#errorFieldValidateStoppers).forEach((stop) => stop());
    this.#errorFieldValidateStoppers.clear();
  };
}
