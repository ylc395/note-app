export type MaybeArray<T> = T | T[];

export function arrayOf<T>(value: MaybeArray<T>) {
  return Array.isArray(value) ? value : [value];
}

export type TypedMapKey<T> = symbol | { __type__: T };

export class TypedMap extends Map {
  public override get<T>(key: TypedMapKey<T>): T | undefined {
    return super.get(key);
  }

  public override set<T>(key: TypedMapKey<T>, value: T) {
    return super.set(key, value);
  }
}
