export function buildIndex<T>(list: T[], key?: keyof T) {
  const index: Record<string | number, T> = {};
  const indexBy = key || 'id';

  for (const item of list) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const _key = (item as any)[indexBy];

    if ((typeof _key !== 'string' && typeof _key !== 'number') || _key in index) {
      throw new Error('invalid key');
    }

    index[_key] = item;
  }

  return index;
}
