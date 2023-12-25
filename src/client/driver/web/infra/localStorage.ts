import type { LocalStorage } from '@domain/app/infra/localStorage';

const webLocalStorage: LocalStorage = {
  get(key) {
    const json = localStorage.getItem(key);

    try {
      return json ? JSON.parse(json) : null;
    } catch {
      return null;
    }
  },

  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
};

export default webLocalStorage;
