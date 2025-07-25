export type MaybeArray<T> = T | T[];

export function arrayOf<T>(value: MaybeArray<T>) {
  return Array.isArray(value) ? value : [value];
}
