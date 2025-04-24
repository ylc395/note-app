interface Constructor<T> {
  new (...args: unknown[]): T;
}

type InjectionKey<T> = symbol | { __type__: T };

export type Token<T> = InjectionKey<T> | Constructor<T>;

const map = new Map();

export default {
  resolve<T>(token: Token<T>): T {
    let instance = map.get(token);

    if (instance) {
      return instance;
    }

    if (typeof token === 'function') {
      instance = new token();
      map.set(token, instance);

      return instance;
    }

    throw new Error(`invalid token: ${String(token)}`);
  },

  register<T>(token: Token<T>, value: T) {
    if (map.has(token)) {
      throw new Error('can not register again');
    }

    map.set(token, value);
  },
};
