import { debounce } from 'lodash-es';
import { action, makeObservable, runInAction } from 'mobx';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withAbortSignal<F extends (signal: AbortSignal, ...args: any[]) => any>(
  func: F,
): (...args: Parameters<F> extends [AbortSignal, ...infer P] ? P : never) => void {
  let abortController: AbortController | undefined;
  let abort: AbortController['abort'] | undefined;

  return function (...args: Parameters<F> extends [AbortSignal, ...infer P] ? P : never) {
    abort?.();

    abortController = new AbortController();
    abort = abortController.abort.bind(abortController);

    return func(abortController.signal, ...args);
  };
}

export function debounceAction<T extends unknown[]>(fn: (...args: T) => unknown, timeout: number) {
  const debounced = debounce(run, timeout);

  function run(...args: T) {
    runInAction(() => {
      fn(...args);
      reactiveDebounced.isPending = false;
    });
  }

  const reactiveDebounced = Object.assign(
    action(function (...args: T) {
      reactiveDebounced.isPending = true;
      debounced(...args);
    }),
    {
      isPending: false,
      flush: debounced.flush,
      cancel: action(() => {
        debounced.cancel();
        reactiveDebounced.isPending = false;
      }),
    },
  );

  makeObservable(reactiveDebounced, { isPending: true });

  return reactiveDebounced;
}
