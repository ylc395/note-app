import { container } from 'tsyringe';

import { token as rpcToken } from '@domain/client/common/infra/rpc';
import { Duration } from '@domain/shared/model/memo';

export default class Calendar {
  private readonly remote = container.resolve(rpcToken);
  constructor(private readonly options: { onSelect: (duration: Duration) => void }) {}
}
