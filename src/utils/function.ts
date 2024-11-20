export function onlyWhen<T>(predicate: (value: T) => boolean, cb: (value: T) => void) {
  return (value: T) => {
    if (predicate(value)) {
      cb(value);
    }
  };
}
