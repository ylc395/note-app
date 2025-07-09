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
