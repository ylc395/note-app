import Runtime from 'infra/Runtime';

export default class LocalHttpRuntime extends Runtime {
  toggleHttpServer(): never {
    throw new Error('can not toggleHttpServer');
  }
}
