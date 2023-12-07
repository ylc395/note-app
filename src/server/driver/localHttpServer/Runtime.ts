import DesktopRuntime from '@domain/infra/DesktopRuntime.js';

export default class LocalHttpRuntime extends DesktopRuntime {
  toggleHttpServer(): never {
    throw new Error('can not toggleHttpServer');
  }
}
