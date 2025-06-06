import type { LocalStorage } from '#domain/client/shared/infra/localStorage';

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

export default webLocalStorage;
