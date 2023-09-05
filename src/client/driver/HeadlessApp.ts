import ClientApp from 'infra/ClientApp';

export default class HeadlessApp extends ClientApp {
  toggleHttpServer(): never {
    throw new Error('can not toggleHttpServer');
  }

  getAppToken(): never {
    throw new Error('can not getAppToken');
  }
}
