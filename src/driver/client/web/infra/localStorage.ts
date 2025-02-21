import type { LocalStorage } from '#domain/client/shared/infra/localStorage';
import type { ZodSchema } from 'zod';

const webLocalStorage: LocalStorage = {
  getSync<T>(key: string, schema?: ZodSchema<T>) {
    const json = localStorage.getItem(key);

    if (json === null) {
      return null;
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(json);
    } catch (error) {
      return null;
    }

    if (schema) {
      const result = schema.safeParse(parsed);

      if (!result.success) {
        return null;
      }
    }

    return parsed;
  },

  get() {
    throw new Error('not impl');
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
