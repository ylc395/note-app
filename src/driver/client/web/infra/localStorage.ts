import type { LocalStorage } from '#domain/client/shared/infra/localStorage';
import type { ZodSchema } from 'zod';

const webLocalStorage: LocalStorage = {
  get<T>(key: string, schema?: ZodSchema<T>) {
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

  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  delete(key) {
    localStorage.removeItem(key);
  },
};

export default webLocalStorage;
