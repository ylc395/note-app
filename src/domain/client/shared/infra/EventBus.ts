import Emitter, { type EventName } from 'emittery';

import { IS_PRODUCTION } from '#domain/shared/infra/env';
import { token } from '#domain/shared/infra/logger';
import container from '#utils/singletonContainer';

export type Events = Record<EventName, unknown>;

export default class EventBus<T extends Events> extends Emitter<T> {
  private readonly logger = container.resolve(token);
  constructor(name: string) {
    super({
      debug: {
        name,
        enabled: !IS_PRODUCTION,
        logger: (type, debugName, eventName, eventData) => {
          if (
            type === 'emit' &&
            String(eventName) !== 'Symbol(listenerAdded)' &&
            String(eventName) !== 'Symbol(listenerRemoved)'
          ) {
            this.logger.debug(`[eventBus ${debugName}]: ${type} ${String(eventName)}`, eventData);
          }
        },
      },
    });
  }
}
