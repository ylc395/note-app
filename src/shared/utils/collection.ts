import type { EntityId } from 'interface/Entity';

export function buildIndex<T extends { id: EntityId | number }>(list: T[]) {
  const index: Record<string, T> = {};

  for (const item of list) {
    index[item.id] = item;
  }

  return index;
}
