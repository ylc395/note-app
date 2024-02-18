import { container } from 'tsyringe';

import { token as rpcToken } from '@domain/common/infra/rpc';
import { Duration } from '@shared/domain/model/memo';

export default class Calendar {
  private readonly remote = container.resolve(rpcToken);
  constructor(private readonly options: { onSelect: (duration: Duration) => void }) {}
}
