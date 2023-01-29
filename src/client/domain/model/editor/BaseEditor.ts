import { container } from 'tsyringe';
import uid from 'lodash/uniqueId';

import { type Remote, token as remoteToken } from 'infra/Remote';

export default abstract class BaseEditor {
  readonly id = uid('editor-');
  protected readonly remote: Remote = container.resolve(remoteToken);
  abstract entityId: string;
  abstract title: string;
}
