import type { Remote } from 'service/repository/remote';

const client: Remote = {
  async get<T>() {
    return {} as T;
  },
  async post<T>() {
    return {} as T;
  },
};

export default client;
