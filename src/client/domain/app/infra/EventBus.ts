import Emitter, { EventName } from 'emittery';

export type Events = Record<EventName, unknown>;

export default class EventBus<T extends Events> extends Emitter<T> {
  constructor(name: string) {
    super({
      debug: {
        name,
        enabled: true,
        // todo: add custom logger for production
        logger: (type, debugName, eventName, eventData) => {
          console.log(`[eventBus ${debugName}]: ${type} ${String(eventName)}`, eventData);
        },
      },
    });
  }
}
