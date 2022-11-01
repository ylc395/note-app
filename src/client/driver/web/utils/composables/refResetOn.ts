import { type CustomRefFactory, type Ref, customRef } from 'vue';
import { tryOnScopeDispose, type EventHookOn } from '@vueuse/core';

/**
 * Create a ref which will be reset when eventHook is triggered.
 *
 * @param defaultValue The value which will be set.
 * @param on EventHook's register
 */
export default function refResetOn<T>(defaultValue: () => T, on: EventHookOn): Ref<T>;
export default function refResetOn<T>(defaultValue: T, on: EventHookOn): Ref<T>;
export default function refResetOn<T>(defaultValue: unknown, on: EventHookOn): Ref<T> {
  return customRef<T>((track, trigger) => {
    let value: T = typeof defaultValue === 'function' ? defaultValue() : defaultValue;

    const valRef: ReturnType<CustomRefFactory<T>> = {
      get() {
        track();
        return value;
      },
      set(newValue) {
        value = newValue;
        trigger();
      },
    };

    const hook = on(() => {
      valRef.set(typeof defaultValue === 'function' ? defaultValue() : defaultValue);
    });

    tryOnScopeDispose(hook.off);

    return valRef;
  });
}
