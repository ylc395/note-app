import type { EntityId } from 'interface/Entity';

export function buildIndex<T extends { id: EntityId | number }>(list: T[], key?: keyof T) {
  const index: Record<string | number, T> = {};
  const indexBy = key || 'id';

  for (const item of list) {
    const _key = item[indexBy];

    if ((typeof _key !== 'string' && typeof _key !== 'number') || _key in index) {
      throw new Error('invalid key');
    }

    index[_key] = item;
  }

  return index;
}
