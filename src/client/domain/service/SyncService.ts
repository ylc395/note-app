import { container, singleton } from 'tsyringe';

import { token as remoteToken } from 'infra/Remote';

@singleton()
export default class SyncService {
  private readonly remote = container.resolve(remoteToken);

  readonly startSync = () => {
    this.remote.post('/synchronization', {});
  };
}
