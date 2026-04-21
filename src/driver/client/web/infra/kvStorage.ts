import type { KvStorage } from '#domain/client/shared/infra/kvStorage';
import { APP_NAME, IS_CLEAN_DEV } from '#domain/shared/infra/env';
import type { ZodType } from 'zod';

function addPrefix(key: string) {
  return `${APP_NAME}:${key}`;
}

class WebKvlStorage implements KvStorage {
  constructor() {
    if (IS_CLEAN_DEV) {
      localStorage.clear();
    }
  }

  get(key: string, schema?: ZodType) {
    const json = localStorage.getItem(addPrefix(key));

    if (json === null) {
      return Promise.resolve(null);
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(json);

      if (schema) {
        parsed = schema.parse(parsed);
      }
    } catch (error) {
      return Promise.resolve(null);
    }

    return Promise.resolve(parsed);
  }

  set(key: string, value: unknown) {
    localStorage.setItem(addPrefix(key), JSON.stringify(value));
    return Promise.resolve();
  }

  delete(key: string) {
    localStorage.removeItem(addPrefix(key));
    return Promise.resolve();
  }
}

export default new WebKvlStorage();
