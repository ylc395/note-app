import type { Remote } from 'infra/Remote';

const client: Remote = {
  async get<T>() {
    return {} as T;
  },
  async post<T>() {
    return {} as T;
  },
};

export default client;
