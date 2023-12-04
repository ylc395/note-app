import type { Remote } from '@domain/infra/remote';

const httpClient: Remote = {
  async get<T>() {
    return {} as T;
  },
  async post<T>() {
    return {} as T;
  },
  async delete<T>() {
    return {} as T;
  },
  async patch<T>() {
    return {} as T;
  },
  async put<T>() {
    return {} as T;
  },
};

export default httpClient;
