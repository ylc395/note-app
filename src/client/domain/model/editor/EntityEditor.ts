import { container } from 'tsyringe';
import uid from 'lodash/uniqueId';

import { token as remoteToken } from 'infra/Remote';
import type Window from 'model/Window';

export default abstract class EntityEditor {
  constructor(protected readonly window: Window, readonly entityId: string) {}
  readonly id = uid('editor-');
  protected readonly remote = container.resolve(remoteToken);
  abstract title: string;
}
