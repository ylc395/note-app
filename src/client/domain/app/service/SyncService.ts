import { container, singleton } from 'tsyringe';

import { token as remoteToken } from '@domain/common/infra/remote';

@singleton()
export default class SyncService {
  private readonly remote = container.resolve(remoteToken);

  readonly startSync = () => {
    this.remote.post('/synchronization', {});
  };
}
