import type { LocalStorage } from '#domain/client/shared/infra/localStorage';
import { IS_CLEAN_DEV } from '#domain/shared/infra/env';

const webLocalStorage: LocalStorage = {
  get(key: string) {
    const json = localStorage.getItem(key);

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
    localStorage.setItem(key, JSON.stringify(value));
    return Promise.resolve();
  },

  delete(key) {
    localStorage.removeItem(key);
    return Promise.resolve();
  },
};

if (IS_CLEAN_DEV) {
  localStorage.clear();
}

export default webLocalStorage;
