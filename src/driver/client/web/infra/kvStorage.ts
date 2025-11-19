import type { KvStorage } from '#domain/client/shared/infra/kvStorage';
import { APP_NAME, IS_CLEAN_DEV } from '#domain/shared/infra/env';

function addPrefix(key: string) {
  return `${APP_NAME}:${key}`;
}

const webKvlStorage: KvStorage = {
  get(key: string) {
    const json = localStorage.getItem(addPrefix(key));

    if (json === null) {
      return Promise.resolve(null);
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(json);
    } catch (error) {
      return Promise.resolve(null);
    }

    return Promise.resolve(parsed);
  },

  set(key, value) {
    localStorage.setItem(addPrefix(key), JSON.stringify(value));
    return Promise.resolve();
  },

  delete(key) {
    localStorage.removeItem(addPrefix(key));
    return Promise.resolve();
  },
};

if (IS_CLEAN_DEV) {
  localStorage.clear();
}

export default webKvlStorage;
